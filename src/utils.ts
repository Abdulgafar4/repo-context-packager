import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

export async function collectFiles(repoPath: string, include?: string[], exclude?: string[]): Promise<string[]> {
    const ignorePatterns = fs.existsSync(path.join(repoPath, '.gitignore'))
        ? fs.readFileSync(path.join(repoPath, '.gitignore'), 'utf-8').split('\n').filter(line => line.trim() !== '' && !line.startsWith('#'))
        : [];

    const files = await glob(include || '**/*', {
        cwd: repoPath,
        nodir: true,
        ignore: ['node_modules/**', '.git/**', ...ignorePatterns, ...(exclude || [])],
    });

    return files;
}

// src/utils.ts

export function readFileContents(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const fs = require('fs');
        fs.readFile(filePath, 'utf8', (err: NodeJS.ErrnoException | null, data: string) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
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

// Additional utility functions can be added here as needed.