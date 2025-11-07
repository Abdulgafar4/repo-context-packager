import { describe, expect, beforeEach, it } from 'vitest';
import { RepositoryStatistics } from './statistics';
import { FileInfo } from './types';

const createFile = (overrides: Partial<FileInfo> = {}): FileInfo => ({
    path: 'src/index.ts',
    size: 120,
    lines: 30,
    content: 'a'.repeat(120),
    ...overrides,
});

describe('RepositoryStatistics', () => {
    let stats: RepositoryStatistics;

    beforeEach(() => {
        stats = new RepositoryStatistics();
    });

    it('tracks file metrics and directories', () => {
        const firstFile = createFile();
        const secondFile = createFile({
            path: 'docs/guide.md',
            lines: 80,
            content: 'b'.repeat(80),
        });

        stats.trackFile(firstFile, '.');
        stats.trackFile(secondFile, '.');

        expect(stats.getTotalCharacters()).toBe(firstFile.content.length + secondFile.content.length);
        expect(stats.getCurrentTokens()).toBe(Math.round(firstFile.content.length / 4) + Math.round(secondFile.content.length / 4));
        expect(stats.getFileTypes()).toEqual({
            '.ts': 1,
            '.md': 1,
        });
        expect(stats.getLargestFile()).toEqual({ path: secondFile.path, lines: secondFile.lines });
        expect(stats.getDirectoriesProcessedCount()).toBe(2);
    });

    it('calculates average file size', () => {
        const files = [
            createFile({ lines: 10 }),
            createFile({ lines: 20 }),
            createFile({ lines: 25 }),
        ];

        expect(stats.calculateAverageFileSize(files)).toBe(Math.round((10 + 20 + 25) / 3));
        expect(stats.calculateAverageFileSize([])).toBe(0);
    });

    it('checks token limit and resets statistics', () => {
        const trackedFile = createFile({ content: 'a'.repeat(40) });
        stats.trackFile(trackedFile, '.');

        expect(stats.wouldExceedTokenLimit('b'.repeat(40), stats.getCurrentTokens() * 2)).toBe(false);
        expect(stats.wouldExceedTokenLimit('c'.repeat(200), stats.getCurrentTokens() + 20)).toBe(true);

        stats.reset();

        expect(stats.getTotalCharacters()).toBe(0);
        expect(stats.getCurrentTokens()).toBe(0);
        expect(stats.getFileTypes()).toEqual({});
        expect(stats.getLargestFile()).toBeNull();
        expect(stats.getDirectoriesProcessedCount()).toBe(0);
    });
});

