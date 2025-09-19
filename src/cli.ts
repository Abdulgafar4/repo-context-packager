import { Command } from 'commander';
import { Packager } from './packager';
import fs from 'fs';
import chalk from 'chalk';
import path from 'path';

const program = new Command();

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
  .action(async (paths, options) => { // Changed from 'path' to 'paths'
    // Input validation
    if (!paths || paths.length === 0) {
      console.error(chalk.red('❌ Error: No paths provided. Please specify at least one file or directory path.'));
      process.exit(1);
    }

    console.log(chalk.blue.bold('📦 Repository Context Packager'));
    console.log(chalk.gray('━'.repeat(50)));

    const packagerOptions: { include?: string[], exclude?: string[], tokens?: boolean, maxFileSize?: number, maxTokens?: number, summary?: boolean } = {};
    
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
    if (options.maxFileSize) {
      const maxFileSize = parseInt(options.maxFileSize, 10);
      if (isNaN(maxFileSize) || maxFileSize <= 0) {
        console.error(chalk.red('❌ Error: --max-file-size must be a positive number'));
        process.exit(1);
      }
      packagerOptions.maxFileSize = maxFileSize;
    }
    if (options.maxTokens) {
      const maxTokens = parseInt(options.maxTokens, 10);
      if (isNaN(maxTokens) || maxTokens <= 0) {
        console.error(chalk.red('❌ Error: --max-tokens must be a positive number'));
        process.exit(1);
      }
      packagerOptions.maxTokens = maxTokens;
    }

    // Set default output file if not specified
    const outputFile = options.output || 'output.md';
    
    // Validate output file path
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

    try {
      console.log(chalk.yellow('🔍 Analyzing repository...'));
      
      // Handle multiple paths
      const packager = new Packager(paths, packagerOptions);
      await packager.analyzeRepository();
      const repoInfo = packager.getRepoInfo();
      
      console.log(chalk.green(`✅ Found ${repoInfo.totalFiles} files (${repoInfo.totalLines} total lines)`));
      if (packagerOptions.tokens) {
        console.log(chalk.cyan(`🔢 Estimated tokens: ${repoInfo.totalTokens}`));
      }
      
      console.log(chalk.yellow('📝 Generating package...'));
      const output = packager.generatePackage();

      await fs.promises.writeFile(outputFile, output);
      
      console.log(chalk.gray('━'.repeat(50)));
      console.log(chalk.green.bold(`🎉 Success! Repository context packaged to:`));
      console.log(chalk.blue.underline(path.resolve(outputFile)));
      
      const stats = fs.statSync(outputFile);
      console.log(chalk.gray(`📄 Output file size: ${(stats.size / 1024).toFixed(2)} KB`));
      
      if (!options.output) {
        console.log(chalk.gray(`💡 Tip: Use -o <filename> to specify a custom output file`));
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);