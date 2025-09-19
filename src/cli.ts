import { Command } from 'commander';
import { Packager } from './packager';
import fs from 'fs';

const program = new Command();

program
  .version('1.0.0')
  .description('Repository Context Packager CLI')
  .argument('<paths...>', 'Paths to repositories or files to package') // Changed to accept multiple paths
  .option('-o, --output <file>', 'Output file for the packaged context')
  .option('--include <patterns>', 'Comma-separated list of file patterns to include')
  .option('--exclude <patterns>', 'Comma-separated list of file patterns to exclude')
  .option('--tokens', 'Estimate token counts')
  .option('--max-file-size <size>', 'Limit output to files under specified size (in bytes)')
  .option('--max-tokens <count>', 'Limit total output to specified number of tokens')
  .action(async (paths, options) => { // Changed from 'path' to 'paths'
    // Input validation
    if (!paths || paths.length === 0) {
      console.error('Error: No paths provided. Please specify at least one file or directory path.');
      process.exit(1);
    }

    const packagerOptions: { include?: string[], exclude?: string[], tokens?: boolean, maxFileSize?: number, maxTokens?: number } = {};
    
    if (options.include) {
      packagerOptions.include = options.include.split(',').map((p: string) => p.trim());
    }
    if (options.exclude) {
      packagerOptions.exclude = options.exclude.split(',').map((p: string) => p.trim());
    }
    if (options.tokens) {
      packagerOptions.tokens = options.tokens;
    }
    if (options.maxFileSize) {
      const maxFileSize = parseInt(options.maxFileSize, 10);
      if (isNaN(maxFileSize) || maxFileSize <= 0) {
        console.error('Error: --max-file-size must be a positive number');
        process.exit(1);
      }
      packagerOptions.maxFileSize = maxFileSize;
    }
    if (options.maxTokens) {
      const maxTokens = parseInt(options.maxTokens, 10);
      if (isNaN(maxTokens) || maxTokens <= 0) {
        console.error('Error: --max-tokens must be a positive number');
        process.exit(1);
      }
      packagerOptions.maxTokens = maxTokens;
    }

    // Validate output file path
    if (options.output) {
      try {
        const outputDir = require('path').dirname(options.output);
        if (outputDir !== '.' && !fs.existsSync(outputDir)) {
          console.error(`Error: Output directory '${outputDir}' does not exist`);
          process.exit(1);
        }
      } catch (error) {
        console.error(`Error: Invalid output path '${options.output}'`);
        process.exit(1);
      }
    }

    try {
      // Handle multiple paths
      const packager = new Packager(paths, packagerOptions); // Pass array of paths
      await packager.analyzeRepository();
      const output = packager.generatePackage();

      if (options.output) {
        await fs.promises.writeFile(options.output, output);
        console.error(`Repository context packaged to ${options.output}`); // Use stderr for messages
      } else {
        console.log(output); // stdout for actual output
      }
    } catch (error) {
      console.error(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);