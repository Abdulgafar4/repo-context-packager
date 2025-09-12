import { Command } from 'commander';
import { Packager } from './packager';
import fs from 'fs';

const program = new Command();

program
  .version('1.0.0')
  .description('Repository Context Packager CLI')
  .argument('<path>', 'Path to the repository or files to package')
  .option('-o, --output <file>', 'Output file for the packaged context')
  .option('--include <patterns>', 'Comma-separated list of file patterns to include')
  .option('--exclude <patterns>', 'Comma-separated list of file patterns to exclude')
  .option('--tokens', 'Estimate token counts')
  .option('--max-file-size <size>', 'Limit output to files under specified size (in bytes)')
  .option('--max-tokens <count>', 'Limit total output to specified number of tokens')
  .action(async (path, options) => {
    const packagerOptions: { include?: string[], exclude?: string[], tokens?: boolean, maxFileSize?: number, maxTokens?: number } = {};
    if (options.include) {
      packagerOptions.include = options.include.split(',');
    }
    if (options.exclude) {
      packagerOptions.exclude = options.exclude.split(',');
    }
    if (options.tokens) {
      packagerOptions.tokens = options.tokens;
    }
    if (options.maxFileSize) {
      packagerOptions.maxFileSize = parseInt(options.maxFileSize, 10);
    }
    if (options.maxTokens) {
      packagerOptions.maxTokens = parseInt(options.maxTokens, 10);
    }

    const packager = new Packager(path, packagerOptions);
    await packager.analyzeRepository();
    const output = packager.generatePackage();

    if (options.output) {
      fs.promises.writeFile(options.output, output);
      console.log(`Repository context packaged to ${options.output}`);
    } else {
      console.log(output);
    }
  });

program.parse(process.argv);