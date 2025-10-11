import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

/**
 * Default patterns to ignore when collecting files from a repository.
 * These patterns follow glob syntax and are applied in addition to .gitignore rules.
 */
const DEFAULT_IGNORE_PATTERNS = [
    'node_modules/**', 
    '.git/**', 
    '*.log', 
    'dist/**', 
    'build/**',
    'output.md',
    '*.lock',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'bun.lockb',
    'README.md',
    'readme.md',
    'Instruction.md',
    'instruction.md',
    'INSTRUCTIONS.md',
    'LICENSE',
    'license',
    'LICENSE.txt',
    'CHANGELOG.md',
    'changelog.md',
    '.gitignore',
    '.gitattributes',
    '.env*',
    '*.env',
    '.DS_Store',
    'Thumbs.db',
    '*.tmp',
    '*.temp',
    '*.cache',
    'coverage/**',
    '.nyc_output/**',
    '.vscode/**',
    '.idea/**',
    '*.swp',
    '*.swo',
    '*~'
];

export async function collectFiles(repoPath: string, include?: string[], exclude?: string[], recentDays?: number): Promise<string[]> {
    const ignorePatterns = fs.existsSync(path.join(repoPath, '.gitignore'))
        ? fs.readFileSync(path.join(repoPath, '.gitignore'), 'utf-8')
            .split('\n')
            .filter(line => line.trim() !== '' && !line.startsWith('#'))
            .map(line => line.trim())
        : [];

    const patterns = include && include.length > 0 ? include : ['**/*'];
    
    const files = await glob(patterns, {
        cwd: repoPath,
        nodir: true,
        ignore: [...DEFAULT_IGNORE_PATTERNS, ...ignorePatterns, ...(exclude || [])],
    });

    // Filter by recent modification date if specified
    if (recentDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - recentDays);
        
        const recentFiles = files.filter(file => {
            const fullPath = path.join(repoPath, file);
            return isFileRecentlyModified(fullPath, recentDays);
        });
        
        return recentFiles;
    }

    return files;
}

export async function readFileContents(filePath: string): Promise<string> {
    try {
        // Check if file is likely binary
        if (isBinaryFile(filePath)) {
            return `[Binary file: ${path.basename(filePath)} (${fs.statSync(filePath).size} bytes)]`;
        }

        const fileName = path.basename(filePath);
        const content = await fs.promises.readFile(filePath, 'utf8');
        
        // Extract useful parts from common config files
        if (fileName === 'package.json') {
            return extractPackageJsonSummary(content);
        }
        
        if (fileName === 'tsconfig.json') {
            return extractTsConfigSummary(content);
        }
        
        // Truncate very large files (>16KB as mentioned in requirements)
        const maxSize = 16 * 1024; // 16KB
        if (content.length > maxSize) {
            const truncated = content.substring(0, maxSize);
            const lastNewline = truncated.lastIndexOf('\n');
            const finalContent = lastNewline > 0 ? truncated.substring(0, lastNewline) : truncated;
            return `${finalContent}\n\n... [File truncated: showing first ${finalContent.length} characters of ${content.length}]`;
        }
        
        return content;
    } catch (error: any) {
        throw new Error(`Cannot read file: ${error.message}`);
    }
}

function isBinaryFile(filePath: string): boolean {
    const binaryExtensions = [
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.zip', '.tar', '.gz', '.rar', '.7z',
        '.exe', '.dll', '.so', '.dylib',
        '.mp3', '.mp4', '.avi', '.mov', '.wav',
        '.ttf', '.otf', '.woff', '.woff2',
        '.pyc', '.class', '.o', '.obj'
    ];
    
    const ext = path.extname(filePath).toLowerCase();
    return binaryExtensions.includes(ext);
}

export function formatOutput(content: string): string {
    return `# Output\n\n${content}`;
}

/**
 * Estimates the number of tokens in a given text content.
 * Uses a simple heuristic of approximately 4 characters per token.
 * 
 * @param content - The text content to estimate tokens for
 * @returns The estimated number of tokens
 */
export function calculateTokens(content: string): number {
    return Math.round(content.length / 4);
}

export function isFileRecentlyModified(filePath: string, days: number): boolean {
    try {
        const stats = fs.statSync(filePath);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        // Use the more recent of mtime (modified time) or ctime (change time)
        const lastModified = new Date(Math.max(stats.mtime.getTime(), stats.ctime.getTime()));
        
        return lastModified >= cutoffDate;
    } catch (error) {
        // If we can't access the file, consider it not recent
        return false;
    }
}

export function truncateContent(content: string, maxLength: number): string {
    if (content.length > maxLength) {
        return content.substring(0, maxLength) + '... [truncated]';
    }
    return content;
}

function extractPackageJsonSummary(content: string): string {
    try {
        const pkg = JSON.parse(content);
        
        const summary = {
            name: pkg.name,
            version: pkg.version,
            description: pkg.description,
            main: pkg.main,
            scripts: pkg.scripts,
            dependencies: pkg.dependencies ? Object.keys(pkg.dependencies) : [],
            devDependencies: pkg.devDependencies ? Object.keys(pkg.devDependencies) : [],
            engines: pkg.engines,
            type: pkg.type
        };
        
        return JSON.stringify(summary, null, 2);
    } catch (error) {
        return content; // Return original if parsing fails
    }
}

function extractTsConfigSummary(content: string): string {
    try {
        const tsConfig = JSON.parse(content);
        
        const summary = {
            compilerOptions: {
                target: tsConfig.compilerOptions?.target,
                module: tsConfig.compilerOptions?.module,
                outDir: tsConfig.compilerOptions?.outDir,
                rootDir: tsConfig.compilerOptions?.rootDir,
                strict: tsConfig.compilerOptions?.strict,
                esModuleInterop: tsConfig.compilerOptions?.esModuleInterop,
                skipLibCheck: tsConfig.compilerOptions?.skipLibCheck
            },
            include: tsConfig.include,
            exclude: tsConfig.exclude
        };
        
        return JSON.stringify(summary, null, 2);
    } catch (error) {
        return content; // Return original if parsing fails
    }
}