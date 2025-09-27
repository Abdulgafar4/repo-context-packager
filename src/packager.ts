import fs from 'fs';
import path from 'path';
import { RepoInfo, FileInfo } from './types';
import { getGitInfo } from './git';
import { collectFiles, readFileContents } from './utils';
import { summarizeCode, formatSummary } from './summarizer';

export class Packager {
    private paths: string[];
    private repoInfo: RepoInfo;
    private include?: string[];
    private exclude?: string[];
    private tokens: boolean;
    private maxFileSize?: number;
    private maxTokens?: number;
    private summary: boolean;
    private recent?: number;
    private verbose: boolean;

    constructor(paths: string | string[], options: { include?: string[], exclude?: string[], tokens?: boolean, maxFileSize?: number, maxTokens?: number, summary?: boolean, recent?: number, verbose?: boolean } = {}) {
        // Handle both single path and array of paths
        this.paths = Array.isArray(paths) ? paths : [paths];
        this.include = options.include;
        this.exclude = options.exclude;
        this.tokens = options.tokens || false;
        this.maxFileSize = options.maxFileSize;
        this.maxTokens = options.maxTokens;
        this.summary = options.summary || false;
        this.recent = options.recent;
        this.verbose = options.verbose || false;
        this.repoInfo = {
            gitInfo: null,
            files: [],
            totalFiles: 0,
            totalLines: 0,
            totalTokens: 0,
            totalCharacters: 0,
            directoriesProcessed: 0,
            fileTypes: {},
            largestFile: null,
            averageFileSize: 0,
        };
    }

    public async analyzeRepository(): Promise<void> {
        // For multiple paths, use the first directory or current directory for git info
        let primaryPath = this.paths.find(p => fs.existsSync(p) && fs.statSync(p).isDirectory());
        
        // If no directory found, use the directory of the first file path
        if (!primaryPath && this.paths.length > 0) {
            const firstPath = this.paths[0];
            if (fs.existsSync(firstPath)) {
                primaryPath = fs.statSync(firstPath).isFile() ? path.dirname(firstPath) : firstPath;
            }
        }
        
        // Fall back to current directory
        primaryPath = primaryPath || '.';
        
        if (this.verbose) {
            process.stderr.write(`Processing primary path: ${primaryPath}\n`);
        }
        
        this.repoInfo.gitInfo = getGitInfo(primaryPath);
        
        const allFilePaths: string[] = [];
        
        // Collect files from all paths
        for (const singlePath of this.paths) {
            if (this.verbose) {
                process.stderr.write(`Processing path: ${singlePath}\n`);
            }
            try {
                if (!fs.existsSync(singlePath)) {
                    process.stderr.write(`Error: Path '${singlePath}' does not exist\n`);
                    continue;
                }
                
                const stat = fs.statSync(singlePath);
                
                if (stat.isFile()) {
                    // Check if file is readable
                    try {
                        fs.accessSync(singlePath, fs.constants.R_OK);
                        const relativePath = path.relative(primaryPath, singlePath) || singlePath;
                        if (this.verbose) {
                            process.stderr.write(`Adding file: ${relativePath}\n`);
                        }
                        allFilePaths.push(relativePath);
                    } catch (accessError) {
                        process.stderr.write(`Error: Cannot read file '${singlePath}': Permission denied\n`);
                    }
                } else if (stat.isDirectory()) {
                    // Check if directory is readable
                    try {
                        fs.accessSync(singlePath, fs.constants.R_OK);
                        if (this.verbose) {
                            process.stderr.write(`Scanning directory: ${singlePath}\n`);
                        }
                        const dirFiles = await collectFiles(singlePath, this.include, this.exclude, this.recent);
                        if (this.verbose) {
                            process.stderr.write(`Found ${dirFiles.length} files in directory: ${singlePath}\n`);
                        }
                        allFilePaths.push(...dirFiles.map(f => path.join(singlePath, f)));
                    } catch (accessError) {
                        process.stderr.write(`Error: Cannot read directory '${singlePath}': Permission denied\n`);
                    }
                } else {
                    process.stderr.write(`Warning: '${singlePath}' is neither a file nor a directory\n`);
                }
            } catch (error: any) {
                process.stderr.write(`Error: Cannot access '${singlePath}': ${error.message}\n`);
            }
        }
        
        const fileInfos: FileInfo[] = [];
        let currentTokens = 0;
        const fileTypes: Record<string, number> = {};
        let largestFile: { path: string; lines: number } | null = null;
        let totalCharacters = 0;
        const processedDirectories = new Set<string>();

        if (this.verbose) {
            process.stderr.write(`Processing ${allFilePaths.length} files...\n`);
        }
        
        for (const filePath of allFilePaths) {
            if (this.verbose) {
                process.stderr.write(`Reading file: ${filePath}\n`);
            }
            try {
                // For files collected from directories, they are already properly joined with the directory path
                // For individual files passed as arguments, they might need to be resolved relative to primaryPath
                const fullPath = path.isAbsolute(filePath) ? filePath : 
                    (filePath.startsWith(primaryPath) ? filePath : path.join(primaryPath, filePath));
                
                // Check if file still exists (could have been deleted between collection and processing)
                if (!fs.existsSync(fullPath)) {
                    process.stderr.write(`Warning: File '${filePath}' no longer exists, skipping\n`);
                    continue;
                }
                
                const stats = await fs.promises.stat(fullPath);

                if (this.maxFileSize && stats.size > this.maxFileSize) {
                    if (this.verbose) {
                        process.stderr.write(`Skipping ${filePath}: file too large (${stats.size} bytes, limit: ${this.maxFileSize})\n`);
                    }
                    continue;
                }

                const content = await readFileContents(fullPath);
                const lines = content.split('\n').length;
                const fileTokens = Math.round(content.length / 4);

                if (this.maxTokens && (currentTokens + fileTokens) > this.maxTokens) {
                    if (this.verbose) {
                        process.stderr.write(`Stopping at ${filePath}: token limit reached (${currentTokens + fileTokens} > ${this.maxTokens})\n`);
                    }
                    break;
                }
                
                currentTokens += fileTokens;
                
                // Collect statistics
                totalCharacters += content.length;
                
                // Track file types
                const fileExtension = path.extname(filePath).toLowerCase() || '.txt';
                fileTypes[fileExtension] = (fileTypes[fileExtension] || 0) + 1;
                
                // Track largest file
                if (!largestFile || lines > largestFile.lines) {
                    largestFile = { path: filePath, lines };
                }
                
                // Track directories
                const directory = path.dirname(filePath);
                if (directory !== '.' && directory !== '') {
                    processedDirectories.add(directory);
                }
                
                fileInfos.push({ 
                    path: filePath, 
                    content, 
                    lines, 
                    size: stats.size 
                });
            } catch (error: any) {
                if (error.code === 'ENOENT') {
                    process.stderr.write(`Error: File '${filePath}' not found\n`);
                } else if (error.code === 'EACCES') {
                    process.stderr.write(`Error: Permission denied reading '${filePath}'\n`);
                } else if (error.code === 'EISDIR') {
                    process.stderr.write(`Error: '${filePath}' is a directory, not a file\n`);
                } else {
                    process.stderr.write(`Error: Could not read file '${filePath}': ${error.message}\n`);
                }
            }
        }
        
        this.repoInfo.files = fileInfos;
        this.repoInfo.totalFiles = this.repoInfo.files.length;
        this.repoInfo.totalLines = this.calculateTotalLines(this.repoInfo.files);
        this.repoInfo.totalTokens = this.calculateTotalTokens(this.repoInfo.files);
        this.repoInfo.totalCharacters = totalCharacters;
        this.repoInfo.directoriesProcessed = processedDirectories.size;
        this.repoInfo.fileTypes = fileTypes;
        this.repoInfo.largestFile = largestFile;
        this.repoInfo.averageFileSize = this.repoInfo.totalFiles > 0 ? 
            Math.round(this.repoInfo.totalLines / this.repoInfo.totalFiles) : 0;
    }

    // Make sure these methods exist and are properly defined
    private calculateTotalLines(files: FileInfo[]): number {
        return files.reduce((total, file) => total + file.lines, 0);
    }

    private calculateTotalTokens(files: FileInfo[]): number {
        return files.reduce((total, file) => total + Math.round(file.content.length / 4), 0);
    }

    public getRepoInfo(): RepoInfo {
        return this.repoInfo;
    }

    public generatePackage(): string {
        // Get the primary path for display
        const primaryPath = this.paths[0] || '.';
        
        let output = `# Repository Context\n\n`;
        output += `## File System Location\n\n${path.resolve(primaryPath)}\n\n`;

        if (this.repoInfo.gitInfo) {
            output += `## Git Info\n\n`;
            output += `- Commit: ${this.repoInfo.gitInfo.commit}\n`;
            output += `- Branch: ${this.repoInfo.gitInfo.branch}\n`;
            output += `- Author: ${this.repoInfo.gitInfo.author}\n`;
            output += `- Date: ${this.repoInfo.gitInfo.date}\n\n`;
        } else {
            output += `## Git Info\n\nNot a git repository\n\n`;
        }

        // Add Recent Changes section if recent filter is active
        if (this.recent) {
            output += `## Recent Changes\n\n`;
            output += `Showing files modified within the last ${this.recent} day${this.recent === 1 ? '' : 's'}.\n\n`;
        }

        output += `## Structure\n\n`;
        output += '```\n';
        output += this.generateFileTree();
        output += '\n```\n\n';

        output += `## File Contents\n\n`;
        for (const file of this.repoInfo.files) {
            if (this.summary) {
                // Generate summary for code files
                const summary = summarizeCode(file.content, file.path);
                output += formatSummary(summary);
            } else {
                // Full content (original behavior)
                const fileExtension = path.extname(file.path).slice(1);
                output += `### File: ${file.path}\n`;
                output += '```' + (fileExtension || 'txt') + '\n';
                output += file.content;
                output += '\n```\n\n';
            }
        }

        output += `## Summary\n`;
        output += `- Total files: ${this.repoInfo.totalFiles}\n`;
        output += `- Total lines: ${this.repoInfo.totalLines}\n`;
        
        // Enhanced statistics
        const fileTypesEntries = Object.entries(this.repoInfo.fileTypes)
            .sort(([,a], [,b]) => b - a)
            .map(([ext, count]) => `${ext} (${count})`)
            .join(', ');
        if (fileTypesEntries) {
            output += `- File types: ${fileTypesEntries}\n`;
        }
        
        if (this.repoInfo.largestFile) {
            output += `- Largest file: ${this.repoInfo.largestFile.path} (${this.repoInfo.largestFile.lines} lines)\n`;
        }
        
        output += `- Average file size: ${this.repoInfo.averageFileSize} lines\n`;
        output += `- Total characters: ${this.repoInfo.totalCharacters.toLocaleString()}\n`;
        output += `- Directories processed: ${this.repoInfo.directoriesProcessed}\n`;
        
        if (this.recent) {
            output += `- Recent filter: Last ${this.recent} day${this.recent === 1 ? '' : 's'}\n`;
        }
        if (this.tokens) {
            output += `- Estimated tokens: ${this.repoInfo.totalTokens}\n`;
        }

        return output;
    }

    private generateFileTree(): string {
        const root: any = {};
        
        // Build tree structure
        for (const file of this.repoInfo.files) {
            const parts = file.path.split(path.sep).filter(part => part !== '');
            let current = root;
            
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const isFile = i === parts.length - 1;
                
                if (!current[part]) {
                    current[part] = isFile ? null : {};
                }
                
                if (!isFile) {
                    current = current[part];
                }
            }
        }

        // Generate tree string
        const generateTreeString = (node: any, prefix: string = ''): string => {
            let result = '';
            const entries = Object.keys(node).sort((a, b) => {
                // Directories first, then files
                const aIsFile = node[a] === null;
                const bIsFile = node[b] === null;
                if (aIsFile !== bIsFile) {
                    return aIsFile ? 1 : -1;
                }
                return a.localeCompare(b);
            });

            entries.forEach((key, index) => {
                const isLastEntry = index === entries.length - 1;
                const connector = isLastEntry ? '└── ' : '├── ';
                result += prefix + connector + key + '\n';

                if (node[key] !== null && typeof node[key] === 'object') {
                    const newPrefix = prefix + (isLastEntry ? '    ' : '│   ');
                    result += generateTreeString(node[key], newPrefix);
                }
            });

            return result;
        };

        return generateTreeString(root).trim();
    }
}