import fs from 'fs';
import path from 'path';
import { RepoInfo, FileInfo } from './types';
import { getGitInfo } from './git';
import { collectFiles, readFileContents, calculateTokens } from './utils';
import { summarizeCode, formatSummary } from './summarizer';
import { RepositoryStatistics, calculateTotalLines, calculateTotalTokens } from './statistics';
import { logVerbose, logWarning } from './logger';

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
        
        logVerbose(`Processing primary path: ${primaryPath}`, this.verbose);
        
        this.repoInfo.gitInfo = getGitInfo(primaryPath);
        
        const allFilePaths: string[] = [];
        
        // Collect files from all paths
        for (const singlePath of this.paths) {
            logVerbose(`Processing path: ${singlePath}`, this.verbose);
            try {
                if (!fs.existsSync(singlePath)) {
                    logWarning(`Path '${singlePath}' does not exist`);
                    continue;
                }
                
                const stat = fs.statSync(singlePath);
                
                if (stat.isFile()) {
                    // Check if file is readable
                    try {
                        fs.accessSync(singlePath, fs.constants.R_OK);
                        const relativePath = path.relative(primaryPath, singlePath) || singlePath;
                        logVerbose(`Adding file: ${relativePath}`, this.verbose);
                        allFilePaths.push(relativePath);
                    } catch (accessError) {
                        logWarning(`Cannot read file '${singlePath}': Permission denied`);
                    }
                } else if (stat.isDirectory()) {
                    // Check if directory is readable
                    try {
                        fs.accessSync(singlePath, fs.constants.R_OK);
                        logVerbose(`Scanning directory: ${singlePath}`, this.verbose);
                        const dirFiles = await collectFiles(singlePath, this.include, this.exclude, this.recent);
                        logVerbose(`Found ${dirFiles.length} files in directory: ${singlePath}`, this.verbose);
                        allFilePaths.push(...dirFiles.map(f => path.join(singlePath, f)));
                    } catch (accessError) {
                        logWarning(`Cannot read directory '${singlePath}': Permission denied`);
                    }
                } else {
                    logWarning(`'${singlePath}' is neither a file nor a directory`);
                }
            } catch (error: any) {
                logWarning(`Cannot access '${singlePath}': ${error.message}`);
            }
        }
        
        const fileInfos: FileInfo[] = [];
        let currentTokens = 0;
        const statistics = new RepositoryStatistics();

        logVerbose(`Processing ${allFilePaths.length} files...`, this.verbose);
        
        for (const filePath of allFilePaths) {
            logVerbose(`Reading file: ${filePath}`, this.verbose);
            try {
                // For files collected from directories, they are already properly joined with the directory path
                // For individual files passed as arguments, they might need to be resolved relative to primaryPath
                const fullPath = path.isAbsolute(filePath) ? filePath : 
                    (filePath.startsWith(primaryPath) ? filePath : path.join(primaryPath, filePath));
                
                // Check if file still exists (could have been deleted between collection and processing)
                if (!fs.existsSync(fullPath)) {
                    logWarning(`File '${filePath}' no longer exists, skipping`);
                    continue;
                }
                
                const stats = await fs.promises.stat(fullPath);

                if (this.maxFileSize && stats.size > this.maxFileSize) {
                    logVerbose(`Skipping ${filePath}: file too large (${stats.size} bytes, limit: ${this.maxFileSize})`, this.verbose);
                    continue;
                }

                const content = await readFileContents(fullPath);
                const lines = content.split('\n').length;
                const fileTokens = calculateTokens(content);

                if (this.maxTokens && (currentTokens + fileTokens) > this.maxTokens) {
                    logVerbose(`Stopping at ${filePath}: token limit reached (${currentTokens + fileTokens} > ${this.maxTokens})`, this.verbose);
                    break;
                }
                
                currentTokens += fileTokens;
                
                // Track statistics
                statistics.trackFile(filePath, content, lines);
                
                fileInfos.push({ 
                    path: filePath, 
                    content, 
                    lines, 
                    size: stats.size 
                });
            } catch (error: any) {
                if (error.code === 'ENOENT') {
                    logWarning(`File '${filePath}' not found`);
                } else if (error.code === 'EACCES') {
                    logWarning(`Permission denied reading '${filePath}'`);
                } else if (error.code === 'EISDIR') {
                    logWarning(`'${filePath}' is a directory, not a file`);
                } else {
                    logWarning(`Could not read file '${filePath}': ${error.message}`);
                }
            }
        }
        
        this.repoInfo.files = fileInfos;
        this.repoInfo.totalFiles = this.repoInfo.files.length;
        this.repoInfo.totalLines = calculateTotalLines(this.repoInfo.files);
        this.repoInfo.totalTokens = calculateTotalTokens(this.repoInfo.files);
        this.repoInfo.totalCharacters = statistics.getTotalCharacters();
        this.repoInfo.directoriesProcessed = statistics.getDirectoriesCount();
        this.repoInfo.fileTypes = statistics.getFileTypes();
        this.repoInfo.largestFile = statistics.getLargestFile();
        this.repoInfo.averageFileSize = this.repoInfo.totalFiles > 0 ? 
            Math.round(this.repoInfo.totalLines / this.repoInfo.totalFiles) : 0;
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