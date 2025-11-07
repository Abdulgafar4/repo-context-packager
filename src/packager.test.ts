import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Packager } from './packager';

vi.mock('./git', () => ({
    getGitInfo: vi.fn(() => ({
        commit: 'abc123',
        branch: 'main',
        author: 'Test User <test@example.com>',
        date: '2025-01-01',
    })),
}));

let tempDir: string;

const writeFile = (relativePath: string, content: string) => {
    const fullPath = path.join(tempDir, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
};

beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'packager-test-'));

    writeFile(
        'src/main.ts',
        [
            "import { readFileSync } from 'fs';",
            '',
            'export function readConfig(file: string) {',
            "    return readFileSync(file, 'utf-8');",
            '}',
            '',
            'export const VERSION = "1.0.0";',
        ].join('\n'),
    );

    writeFile('docs/notes.txt', 'Project documentation\nSecond line\n');
});

afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

describe('Packager', () => {
    it('analyzes repository files and populates repo info', async () => {
        const packager = new Packager(tempDir, { tokens: true });

        await packager.analyzeRepository();
        const info = packager.getRepoInfo();

        expect(info.totalFiles).toBe(2);
        expect(info.totalLines).toBeGreaterThan(0);
        expect(info.fileTypes['.ts']).toBe(1);
        expect(info.fileTypes['.txt']).toBe(1);
        expect(info.totalTokens).toBeGreaterThan(0);
    });

    it('generates summary output when summary mode is enabled', async () => {
        const packager = new Packager(tempDir, { summary: true });

        await packager.analyzeRepository();
        const output = packager.generatePackage();

        expect(output).toContain('## File Contents');
        expect(output).toContain(`### File: ${path.join(tempDir, 'src/main.ts')}`);
        expect(output).toContain('export function readConfig');
        expect(output).toContain('## Summary');
    });

    it('skips files larger than maxFileSize threshold', async () => {
        writeFile('large/huge.txt', 'x'.repeat(200));

        const mainFileSize = fs.statSync(path.join(tempDir, 'src/main.ts')).size;
        const packager = new Packager(tempDir, { maxFileSize: mainFileSize + 10 });

        await packager.analyzeRepository();
        const info = packager.getRepoInfo();

        const filePaths = info.files.map(file => file.path);

        expect(filePaths).not.toContain(path.join(tempDir, 'large/huge.txt'));
        expect(info.totalFiles).toBe(2);
    });
});

