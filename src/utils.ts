import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

export async function collectFiles(repoPath: string, include?: string[], exclude?: string[]): Promise<string[]> {
    const ignorePatterns = fs.existsSync(path.join(repoPath, '.gitignore'))
        ? fs.readFileSync(path.join(repoPath, '.gitignore'), 'utf-8')
            .split('\n')
            .filter(line => line.trim() !== '' && !line.startsWith('#'))
            .map(line => line.trim())
        : [];

    const patterns = include && include.length > 0 ? include : ['**/*'];
    const defaultIgnore = [
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
    
    const files = await glob(patterns, {
        cwd: repoPath,
        nodir: true,
        ignore: [...defaultIgnore, ...ignorePatterns, ...(exclude || [])],
    });

    return files;
}

export async function readFileContents(filePath: string): Promise<string> {
    try {
        // Check if file is likely binary
        if (isBinaryFile(filePath)) {
            return `[Binary file: ${path.basename(filePath)} (${fs.statSync(filePath).size} bytes)]`;
        }

        const content = await fs.promises.readFile(filePath, 'utf8');
        
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

export function truncateContent(content: string, maxLength: number): string {
    if (content.length > maxLength) {
        return content.substring(0, maxLength) + '... [truncated]';
    }
    return content;
}