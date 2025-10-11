import path from 'path';
import { FileInfo } from './types';
import { calculateTokens } from './utils';

export class RepositoryStatistics {
    private fileTypes: Record<string, number> = {};
    private largestFile: { path: string; lines: number } | null = null;
    private totalCharacters: number = 0;
    private processedDirectories: Set<string> = new Set();

    public trackFile(filePath: string, content: string, lines: number): void {
        // Track file types
        const fileExtension = path.extname(filePath).toLowerCase() || '.txt';
        this.fileTypes[fileExtension] = (this.fileTypes[fileExtension] || 0) + 1;
        
        // Track largest file
        if (!this.largestFile || lines > this.largestFile.lines) {
            this.largestFile = { path: filePath, lines };
        }
        
        // Track total characters
        this.totalCharacters += content.length;
        
        // Track directories
        const directory = path.dirname(filePath);
        if (directory !== '.' && directory !== '') {
            this.processedDirectories.add(directory);
        }
    }

    public getFileTypes(): Record<string, number> {
        return { ...this.fileTypes };
    }

    public getLargestFile(): { path: string; lines: number } | null {
        return this.largestFile ? { ...this.largestFile } : null;
    }

    public getTotalCharacters(): number {
        return this.totalCharacters;
    }

    public getDirectoriesCount(): number {
        return this.processedDirectories.size;
    }

    public calculateAverageFileSize(totalFiles: number): number {
        return totalFiles > 0 ? Math.round(this.getTotalLines() / totalFiles) : 0;
    }

    private getTotalLines(): number {
        // This will be set from outside or we can track it internally
        return this.largestFile?.lines || 0;
    }
}

export function calculateTotalLines(files: FileInfo[]): number {
    return files.reduce((total, file) => total + file.lines, 0);
}

export function calculateTotalTokens(files: FileInfo[]): number {
    return files.reduce((total, file) => total + calculateTokens(file.content), 0);
}

