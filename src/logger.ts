/**
 * Centralized logging utilities for consistent error, warning, and verbose message handling.
 */

/**
 * Writes an error message to stderr.
 * 
 * @param message - The error message to display
 */
export function logError(message: string): void {
    process.stderr.write(`Error: ${message}\n`);
}

/**
 * Writes a warning message to stderr.
 * 
 * @param message - The warning message to display
 */
export function logWarning(message: string): void {
    process.stderr.write(`Warning: ${message}\n`);
}

/**
 * Writes a verbose/debug message to stderr.
 * Only outputs if verbose mode is enabled.
 * 
 * @param message - The verbose message to display
 * @param verbose - Whether verbose mode is enabled
 */
export function logVerbose(message: string, verbose: boolean = true): void {
    if (verbose) {
        process.stderr.write(`${message}\n`);
    }
}

/**
 * Formats and logs a file error based on the error code.
 * 
 * @param filePath - Path to the file that caused the error
 * @param error - The error object
 */
export function logFileError(filePath: string, error: any): void {
    if (error.code === 'ENOENT') {
        logError(`File '${filePath}' not found`);
    } else if (error.code === 'EACCES') {
        logError(`Permission denied reading '${filePath}'`);
    } else if (error.code === 'EISDIR') {
        logError(`'${filePath}' is a directory, not a file`);
    } else {
        logError(`Could not read file '${filePath}': ${error.message}`);
    }
}

/**
 * Logs information about a skipped file.
 * 
 * @param filePath - Path to the file being skipped
 * @param reason - Reason for skipping the file
 * @param verbose - Whether verbose mode is enabled
 */
export function logSkippedFile(filePath: string, reason: string, verbose: boolean = true): void {
    logVerbose(`Skipping ${filePath}: ${reason}`, verbose);
}

/**
 * Logs information about processing a file.
 * 
 * @param filePath - Path to the file being processed
 * @param verbose - Whether verbose mode is enabled
 */
export function logProcessingFile(filePath: string, verbose: boolean = true): void {
    logVerbose(`Reading file: ${filePath}`, verbose);
}

/**
 * Logs information about processing a path.
 * 
 * @param path - Path being processed
 * @param verbose - Whether verbose mode is enabled
 */
export function logProcessingPath(path: string, verbose: boolean = true): void {
    logVerbose(`Processing path: ${path}`, verbose);
}

/**
 * Logs a directory scanning message.
 * 
 * @param directory - Directory being scanned
 * @param verbose - Whether verbose mode is enabled
 */
export function logScanningDirectory(directory: string, verbose: boolean = true): void {
    logVerbose(`Scanning directory: ${directory}`, verbose);
}

/**
 * Logs information about files found in a directory.
 * 
 * @param count - Number of files found
 * @param directory - Directory that was scanned
 * @param verbose - Whether verbose mode is enabled
 */
export function logFilesFound(count: number, directory: string, verbose: boolean = true): void {
    logVerbose(`Found ${count} files in directory: ${directory}`, verbose);
}

