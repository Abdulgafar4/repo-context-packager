import { Command } from 'commander';
import { Packager } from './packager';
import fs from 'fs';
import chalk from 'chalk';
import path from 'path';
import { loadConfig,ConfigOptions } from './config';


const program = new Command();

function applyConfigDefaults(cliOptions: any): any{
  const configDefaults = loadConfig();

  return{
   output: cliOptions.output || configDefaults.output,
   include: cliOptions.include || configDefaults.include,
   exclude: cliOptions.exclude || configDefaults.exclude,
   tokens : cliOptions.tokens ?? configDefaults.tokens,
   summary: cliOptions.summary ?? configDefaults.summary,
   verbose: cliOptions.verbose ?? configDefaults.verbose,
   maxFileSize: cliOptions.maxFileSize || configDefaults.maxFileSize,
   maxTokens: cliOptions.maxTokens || configDefaults.maxTokens,
   recent: cliOptions.recent !== undefined ? cliOptions.recent : configDefaults.recent
  };
}

/**
 * Validates that input paths are provided.
 * 
 * @param paths - Array of input paths
 * @throws Exits process if no paths provided
 */
function validateInputPaths(paths: string[]): void {
  if (!paths || paths.length === 0) {
    console.error(chalk.red('❌ Error: No paths provided. Please specify at least one file or directory path.'));
    process.exit(1);
  }
}

/**
 * Validates that the output file path is valid and directory exists.
 * 
 * @param outputFile - Path to the output file
 * @throws Exits process if output path is invalid
 */
function validateOutputPath(outputFile: string): void {
  try {
    const outputDir = path.dirname(outputFile);
    if (outputDir !== '.' && !fs.existsSync(outputDir)) {
      console.error(chalk.red(`❌ Error: Output directory '${outputDir}' does not exist`));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error: Invalid output path '${outputFile}'`));
    process.exit(1);
  }
}

/**
 * Executes the packaging operation.
 * 
 * @param paths - Array of input paths
 * @param packagerOptions - Parsed packager options
 * @param outputFile - Path to the output file
 */
async function executePackaging(
  paths: string[], 
  packagerOptions: any,
  outputFile: string
): Promise<void> {
  console.log(chalk.yellow('🔍 Analyzing repository...'));
  
  const packager = new Packager(paths, packagerOptions);
  await packager.analyzeRepository();
  const repoInfo = packager.getRepoInfo();
  
  // Display analysis results
  if (packagerOptions.recent) {
    console.log(chalk.green(`✅ Found ${repoInfo.totalFiles} recent files (modified within ${packagerOptions.recent} days) - ${repoInfo.totalLines} total lines`));
  } else {
    console.log(chalk.green(`✅ Found ${repoInfo.totalFiles} files (${repoInfo.totalLines} total lines)`));
  }
  if (packagerOptions.tokens) {
    console.log(chalk.cyan(`🔢 Estimated tokens: ${repoInfo.totalTokens}`));
  }
  
  console.log(chalk.yellow('📝 Generating package...'));
  const output = packager.generatePackage();
  
  await fs.promises.writeFile(outputFile, output);
}

/**
 * Displays success message and results after packaging.
 * 
 * @param outputFile - Path to the output file
 * @param hasCustomOutput - Whether user specified a custom output file
 */
function displayResults(outputFile: string, hasCustomOutput: boolean): void {
  console.log(chalk.gray('━'.repeat(50)));
  console.log(chalk.green.bold(`🎉 Success! Repository context packaged to:`));
  console.log(chalk.blue.underline(path.resolve(outputFile)));
  
  const stats = fs.statSync(outputFile);
  console.log(chalk.gray(`📄 Output file size: ${(stats.size / 1024).toFixed(2)} KB`));
  
  if (!hasCustomOutput) {
    console.log(chalk.gray(`💡 Tip: Use -o <filename> to specify a custom output file`));
  }
}

/**
 * Parses and validates command-line options into packager options.
 * Handles type conversions, validation, and error reporting.
 * 
 * @param options - Raw command-line options from commander
 * @returns Parsed and validated packager options
 */
function parseCommandLineOptions(options: any): { 
  include?: string[], 
  exclude?: string[], 
  tokens?: boolean, 
  maxFileSize?: number, 
  maxTokens?: number, 
  summary?: boolean, 
  recent?: number, 
  verbose?: boolean 
} {
  const packagerOptions: { 
    include?: string[], 
    exclude?: string[], 
    tokens?: boolean, 
    maxFileSize?: number, 
    maxTokens?: number, 
    summary?: boolean, 
    recent?: number, 
    verbose?: boolean 
  } = {};
  
  // Parse include patterns
  if (options.include) {
    packagerOptions.include = options.include.split(',').map((p: string) => p.trim());
  }
  
  // Parse exclude patterns
  if (options.exclude) {
    packagerOptions.exclude = options.exclude.split(',').map((p: string) => p.trim());
  }
  
  // Parse boolean flags
  if (options.tokens) {
    packagerOptions.tokens = options.tokens;
  }
  
  if (options.summary) {
    packagerOptions.summary = options.summary;
  }
  
  if (options.verbose) {
    packagerOptions.verbose = options.verbose;
  }
  
  // Parse and validate recent option
  if (options.recent !== undefined) {
    let recentDays: number;
    if (options.recent === true) {
      // Flag was used without a value, use default of 7
      recentDays = 7;
    } else {
      recentDays = parseInt(options.recent, 10);
      if (isNaN(recentDays) || recentDays <= 0) {
        console.error(chalk.red('❌ Error: --recent must be a positive number'));
        process.exit(1);
      }
    }
    packagerOptions.recent = recentDays;
  }
  
  // Parse and validate maxFileSize option
  if (options.maxFileSize) {
    const maxFileSize = parseInt(options.maxFileSize, 10);
    if (isNaN(maxFileSize) || maxFileSize <= 0) {
      console.error(chalk.red('❌ Error: --max-file-size must be a positive number'));
      process.exit(1);
    }
    packagerOptions.maxFileSize = maxFileSize;
  }
  
  // Parse and validate maxTokens option
  if (options.maxTokens) {
    const maxTokens = parseInt(options.maxTokens, 10);
    if (isNaN(maxTokens) || maxTokens <= 0) {
      console.error(chalk.red('❌ Error: --max-tokens must be a positive number'));
      process.exit(1);
    }
    packagerOptions.maxTokens = maxTokens;
  }
  
  return packagerOptions;
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
    // Validate inputs
    validateInputPaths(paths);

    // Display header
    console.log(chalk.blue.bold('📦 Repository Context Packager'));
    console.log(chalk.gray('━'.repeat(50)));

    // Apply config defaults and parse options
    options = applyConfigDefaults(options);
    const packagerOptions = parseCommandLineOptions(options);

    // Validate and set output file
    const outputFile = options.output || 'output.md';
    validateOutputPath(outputFile);

    // Execute packaging
    try {
      await executePackaging(paths, packagerOptions, outputFile);
      displayResults(outputFile, !!options.output);
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);