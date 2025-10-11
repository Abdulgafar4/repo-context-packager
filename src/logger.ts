import chalk from 'chalk';

export class Logger {
    static error(message: string): void {
        console.error(chalk.red(`❌ Error: ${message}`));
    }

    static warning(message: string): void {
        process.stderr.write(`Warning: ${message}\n`);
    }

    static success(message: string): void {
        console.log(chalk.green(message));
    }

    static info(message: string): void {
        console.log(chalk.yellow(message));
    }

    static verbose(message: string, isVerbose: boolean): void {
        if (isVerbose) {
            process.stderr.write(message);
            if (!message.endsWith('\n')) {
                process.stderr.write('\n');
            }
        }
    }

    static highlight(message: string): void {
        console.log(chalk.blue.underline(message));
    }

    static dim(message: string): void {
        console.log(chalk.gray(message));
    }

    static cyan(message: string): void {
        console.log(chalk.cyan(message));
    }

    static header(title: string): void {
        console.log(chalk.blue.bold(title));
        console.log(chalk.gray('━'.repeat(50)));
    }

    static separator(): void {
        console.log(chalk.gray('━'.repeat(50)));
    }
}

// Convenience functions for backward compatibility
export function logError(message: string): void {
    Logger.error(message);
}

export function logWarning(message: string): void {
    Logger.warning(message);
}

export function logVerbose(message: string, isVerbose: boolean): void {
    Logger.verbose(message, isVerbose);
}

