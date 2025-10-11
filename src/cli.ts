import { Command } from 'commander';
import { Packager } from './packager';
import fs from 'fs';
import chalk from 'chalk';
import path from 'path';
import { loadConfig, ConfigOptions } from './config';
import { Logger } from './logger';

const program = new Command();

interface PackagerOptions {
    include?: string[];
    exclude?: string[];
    tokens?: boolean;
    maxFileSize?: number;
    maxTokens?: number;
    summary?: boolean;
    recent?: number;
    verbose?: boolean;
}

function parsePackagerOptions(options: any): PackagerOptions {
    const packagerOptions: PackagerOptions = {};
    
    if (options.include) {
        packagerOptions.include = options.include.split(',').map((p: string) => p.trim());
    }
    if (options.exclude) {
        packagerOptions.exclude = options.exclude.split(',').map((p: string) => p.trim());
    }
    if (options.tokens) {
        packagerOptions.tokens = options.tokens;
    }
    if (options.summary) {
        packagerOptions.summary = options.summary;
    }
    if (options.recent !== undefined) {
        packagerOptions.recent = validateRecentOption(options.recent);
    }
    if (options.maxFileSize) {
        packagerOptions.maxFileSize = validatePositiveNumber(options.maxFileSize, '--max-file-size');
    }
    if (options.maxTokens) {
        packagerOptions.maxTokens = validatePositiveNumber(options.maxTokens, '--max-tokens');
    }
    if (options.verbose) {
        packagerOptions.verbose = options.verbose;
    }
    
    return packagerOptions;
}

function validateRecentOption(recent: any): number {
    if (recent === true) {
        // Flag was used without a value, use default of 7
        return 7;
    }
    const recentDays = parseInt(recent, 10);
    if (isNaN(recentDays) || recentDays <= 0) {
        Logger.error('--recent must be a positive number');
        process.exit(1);
    }
    return recentDays;
}

function validatePositiveNumber(value: string, optionName: string): number {
    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0) {
        Logger.error(`${optionName} must be a positive number`);
        process.exit(1);
    }
    return num;
}

function validateOutputPath(outputFile: string): void {
    try {
        const outputDir = path.dirname(outputFile);
        if (outputDir !== '.' && !fs.existsSync(outputDir)) {
            Logger.error(`Output directory '${outputDir}' does not exist`);
            process.exit(1);
        }
    } catch (error) {
        Logger.error(`Invalid output path '${outputFile}'`);
        process.exit(1);
    }
}

function applyConfigDefaults(cliOptions: any): any {
    const configDefaults = loadConfig();

    return {
        output: cliOptions.output || configDefaults.output,
        include: cliOptions.include || configDefaults.include,
        exclude: cliOptions.exclude || configDefaults.exclude,
        tokens: cliOptions.tokens ?? configDefaults.tokens,
        summary: cliOptions.summary ?? configDefaults.summary,
        verbose: cliOptions.verbose ?? configDefaults.verbose,
        maxFileSize: cliOptions.maxFileSize || configDefaults.maxFileSize,
        maxTokens: cliOptions.maxTokens || configDefaults.maxTokens,
        recent: cliOptions.recent !== undefined ? cliOptions.recent : configDefaults.recent
    };
}

function displayAnalysisResults(repoInfo: any, packagerOptions: PackagerOptions): void {
    if (packagerOptions.recent) {
        Logger.success(`✅ Found ${repoInfo.totalFiles} recent files (modified within ${packagerOptions.recent} days) - ${repoInfo.totalLines} total lines`);
    } else {
        Logger.success(`✅ Found ${repoInfo.totalFiles} files (${repoInfo.totalLines} total lines)`);
    }
    if (packagerOptions.tokens) {
        Logger.cyan(`🔢 Estimated tokens: ${repoInfo.totalTokens}`);
    }
}

function displaySuccessMessage(outputFile: string, showTip: boolean): void {
    Logger.separator();
    Logger.success('🎉 Success! Repository context packaged to:');
    Logger.highlight(path.resolve(outputFile));
    
    const stats = fs.statSync(outputFile);
    Logger.dim(`📄 Output file size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    if (showTip) {
        Logger.dim('💡 Tip: Use -o <filename> to specify a custom output file');
    }
}

async function executePackaging(paths: string[], packagerOptions: PackagerOptions, outputFile: string): Promise<void> {
    Logger.info('🔍 Analyzing repository...');
    
    const packager = new Packager(paths, packagerOptions);
    await packager.analyzeRepository();
    const repoInfo = packager.getRepoInfo();
    
    displayAnalysisResults(repoInfo, packagerOptions);
    
    Logger.info('📝 Generating package...');
    const output = packager.generatePackage();

    await fs.promises.writeFile(outputFile, output);
}

program
  .version('1.0.0')
  .description('Repository Context Packager CLI')
  .argument('<paths...>', 'Paths to repositories or files to package') // Changed to accept multiple paths
  .option('-o, --output <file>', 'Output file for the packaged context (default: output.md)')
  .option('--include <patterns>', 'Comma-separated list of file patterns to include')
  .option('--exclude <patterns>', 'Comma-separated list of file patterns to exclude')
  .option('--tokens', 'Estimate token counts')
  .option('--max-file-size <size>', 'Limit output to files under specified size (in bytes)')
  .option('--max-tokens <count>', 'Limit total output to specified number of tokens')
  .option('--summary', 'Show function signatures and key info instead of full code')
  .option('-r, --recent [days]', 'Only include files modified within the last N days (default: 7)')
  .option('-v, --verbose', 'Print detailed progress information to stderr')
  .action(async (paths, options) => {
    // Input validation
    if (!paths || paths.length === 0) {
      Logger.error('No paths provided. Please specify at least one file or directory path.');
      process.exit(1);
    }

    Logger.header('📦 Repository Context Packager');

    // Apply config defaults and parse options
    options = applyConfigDefaults(options);
    const packagerOptions = parsePackagerOptions(options);

    // Set default output file and validate
    const outputFile = options.output || 'output.md';
    validateOutputPath(outputFile);

    try {
      await executePackaging(paths, packagerOptions, outputFile);
      displaySuccessMessage(outputFile, !options.output);
    } catch (error) {
      Logger.error((error as Error).message);
      process.exit(1);
    }
  });

program.parse(process.argv);