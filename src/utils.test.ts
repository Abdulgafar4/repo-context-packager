import { describe, expect, it } from 'vitest';
import { calculateTokens, formatOutput, truncateContent } from './utils';

describe('calculateTokens', () => {
    it('estimates tokens by dividing length by four and rounding', () => {
        expect(calculateTokens('abcd')).toBe(1);
        expect(calculateTokens('abcdefgh')).toBe(2);
        expect(calculateTokens('abc')).toBe(1); // rounds to nearest integer
    });
});

describe('formatOutput', () => {
    it('wraps content with an output heading', () => {
        const result = formatOutput('Hello, world!');
        expect(result).toBe('# Output\n\nHello, world!');
    });

    it('handles multi-line content without altering text', () => {
        const result = formatOutput('Line 1\nLine 2');
        expect(result).toBe('# Output\n\nLine 1\nLine 2');
    });
});

describe('truncateContent', () => {
    it('returns original content when within the max length', () => {
        const content = 'short content';
        expect(truncateContent(content, 50)).toBe(content);
    });

    it('does not truncate when content length equals the max length', () => {
        const content = 'exact';
        expect(truncateContent(content, content.length)).toBe(content);
    });

    it('suffixes truncated marker when exceeding the max length', () => {
        const content = 'a'.repeat(10);
        expect(truncateContent(content, 5)).toBe('aaaaa... [truncated]');
    });
});

