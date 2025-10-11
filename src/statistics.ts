import { FileInfo } from './types';
import { calculateTokens } from './utils';
import path from 'path';

/**
 * Handles collection and management of repository statistics.
 * Tracks file counts, types, sizes, tokens, and other metrics during repository analysis.
 */
export class RepositoryStatistics {
    private totalCharacters: number = 0;
    private fileTypes: Record<string, number> = {};
    private largestFile: { path: string; lines: number } | null = null;
    private processedDirectories: Set<string> = new Set();
    private currentTokens: number = 0;

    /**
     * Tracks statistics for a processed file.
     * 
     * @param fileInfo - Information about the processed file
     * @param basePath - Base path for determining relative directories
     */
    public trackFile(fileInfo: FileInfo, basePath: string = '.'): void {
        // Track characters
        this.totalCharacters += fileInfo.content.length;

        // Track tokens
        const fileTokens = calculateTokens(fileInfo.content);
        this.currentTokens += fileTokens;

        // Track file types
        const fileExtension = path.extname(fileInfo.path).toLowerCase() || '.txt';
        this.fileTypes[fileExtension] = (this.fileTypes[fileExtension] || 0) + 1;

        // Track largest file
        if (!this.largestFile || fileInfo.lines > this.largestFile.lines) {
            this.largestFile = { path: fileInfo.path, lines: fileInfo.lines };
        }

        // Track directories
        const directory = path.dirname(fileInfo.path);
        if (directory !== '.' && directory !== '') {
            this.processedDirectories.add(directory);
        }
    }

    /**
     * Checks if adding a file would exceed the token limit.
     * 
     * @param content - The file content to check
     * @param maxTokens - Maximum allowed tokens
     * @returns true if the token limit would be exceeded
     */
    public wouldExceedTokenLimit(content: string, maxTokens?: number): boolean {
        if (!maxTokens) {
            return false;
        }
        const fileTokens = calculateTokens(content);
        return (this.currentTokens + fileTokens) > maxTokens;
    }

    /**
     * Gets the current token count.
     * 
     * @returns Current total tokens
     */
    public getCurrentTokens(): number {
        return this.currentTokens;
    }

    /**
     * Gets the total character count.
     * 
     * @returns Total characters processed
     */
    public getTotalCharacters(): number {
        return this.totalCharacters;
    }

    /**
     * Gets the file types map.
     * 
     * @returns Record of file extensions and their counts
     */
    public getFileTypes(): Record<string, number> {
        return { ...this.fileTypes };
    }

    /**
     * Gets the largest file information.
     * 
     * @returns Information about the largest file or null
     */
    public getLargestFile(): { path: string; lines: number } | null {
        return this.largestFile ? { ...this.largestFile } : null;
    }

    /**
     * Gets the number of directories processed.
     * 
     * @returns Count of unique directories
     */
    public getDirectoriesProcessedCount(): number {
        return this.processedDirectories.size;
    }

    /**
     * Calculates the average file size from a list of files.
     * 
     * @param files - Array of file information
     * @returns Average file size in lines
     */
    public calculateAverageFileSize(files: FileInfo[]): number {
        if (files.length === 0) {
            return 0;
        }
        const totalLines = files.reduce((total, file) => total + file.lines, 0);
        return Math.round(totalLines / files.length);
    }

    /**
     * Resets all statistics to initial state.
     */
    public reset(): void {
        this.totalCharacters = 0;
        this.fileTypes = {};
        this.largestFile = null;
        this.processedDirectories.clear();
        this.currentTokens = 0;
    }
}

