import { describe, expect, it, vi } from 'vitest';
import { 
    logError, 
    logWarning, 
    logVerbose, 
    logFileError,
    logSkippedFile,
    logProcessingFile
} from './logger';

describe('logger', () => {
    it('logs error and warning messages to stderr', () => {
        const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
        
        logError('Something went wrong');
        logWarning('Be careful');
        
        expect(stderrSpy).toHaveBeenCalledWith('Error: Something went wrong\n');
        expect(stderrSpy).toHaveBeenCalledWith('Warning: Be careful\n');
        stderrSpy.mockRestore();
    });

    it('handles verbose mode correctly', () => {
        const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
        
        logVerbose('Debug info', true);
        expect(stderrSpy).toHaveBeenCalledWith('Debug info\n');
        
        stderrSpy.mockClear();
        logVerbose('Hidden info', false);
        expect(stderrSpy).not.toHaveBeenCalled();
        
        stderrSpy.mockRestore();
    });

    it('logs different file error types', () => {
        const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
        
        logFileError('test.txt', { code: 'ENOENT' });
        expect(stderrSpy).toHaveBeenCalledWith("Error: File 'test.txt' not found\n");
        
        logFileError('secret.txt', { code: 'EACCES' });
        expect(stderrSpy).toHaveBeenCalledWith("Error: Permission denied reading 'secret.txt'\n");
        
        logFileError('folder', { code: 'EISDIR' });
        expect(stderrSpy).toHaveBeenCalledWith("Error: 'folder' is a directory, not a file\n");
        
        logFileError('file.txt', { message: 'Unknown error' });
        expect(stderrSpy).toHaveBeenCalledWith("Error: Could not read file 'file.txt': Unknown error\n");
        
        stderrSpy.mockRestore();
    });

    it('logs file processing messages when verbose', () => {
        const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
        
        logSkippedFile('large.txt', 'file too large', true);
        expect(stderrSpy).toHaveBeenCalledWith('Skipping large.txt: file too large\n');
        
        logProcessingFile('src/index.ts', true);
        expect(stderrSpy).toHaveBeenCalledWith('Reading file: src/index.ts\n');
        
        stderrSpy.mockRestore();
    });
});