import { describe, expect, it } from 'vitest';
import { formatSummary, summarizeCode } from './summarizer';

const sampleTsContent = `
import fs from 'fs';
const utils = require('./utils');

/**
 * Loads a configuration file.
 */
export async function loadConfig(path: string): Promise<void> {}

/**
 * Represents the application runtime.
 */
export class AppRuntime {}

const helper = () => {};
`;

describe('summarizeCode', () => {
    it('summarizes TypeScript files with imports, exports, and functions', () => {
        const summary = summarizeCode(sampleTsContent.trim(), 'src/app.ts');

        expect(summary.path).toBe('src/app.ts');
        expect(summary.language).toBe('typescript');
        expect(summary.imports).toEqual(['fs', './utils']);

        const loadConfig = summary.functions.find(func => func.name === 'loadConfig');
        expect(loadConfig).toMatchObject({
            type: 'function',
            isExported: true,
            isAsync: true,
        });
        expect(loadConfig?.description).toBe('Loads a configuration file.');

        const appRuntime = summary.functions.find(func => func.name === 'AppRuntime');
        expect(appRuntime).toMatchObject({
            type: 'class',
            isExported: true,
            isAsync: false,
        });
        expect(summary.functions.some(func => func.name === 'helper')).toBe(true);
        expect(summary.exports).toEqual(['loadConfig', 'AppRuntime']);
    });
});

describe('formatSummary', () => {
    it('formats a summary with metadata and code block markers', () => {
        const summary = summarizeCode(sampleTsContent.trim(), 'src/app.ts');
        const formatted = formatSummary(summary);

        expect(formatted).toContain('### File: src/app.ts');
        expect(formatted).toContain('```typescript');
        expect(formatted).toContain('export async function loadConfig');
        expect(formatted).toContain('export class AppRuntime');
    });
});

