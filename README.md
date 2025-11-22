# Repository Context Packager

## Quick Start

```bash
# Install globally
npm install -g @tajudeen/repo-context-packager

# Package your current repository
repo-context-packager .

# View the generated output.md file
```

## Overview
The Repository Context Packager is a command-line tool designed to analyze local git repositories and create a structured text file containing repository content optimized for sharing with Large Language Models (LLMs). This tool helps developers effectively share their codebase with LLMs by providing context about project structure, dependencies, and relationships between files.

## Features
- Analyzes local git repositories.
- **Two output modes**:
  - **Full mode**: Complete file contents with syntax highlighting
  - **Summary mode**: Function signatures and key information (85% smaller)
- Collects and formats repository information, including:
  - Basic git information (commit, branch, author, date).
  - Project structure overview.
  - File contents with clear separators.
  - Basic metadata and summary statistics.
- **Smart filtering**: Automatically excludes unnecessary files (node_modules, lock files, documentation)
- **Multi-language support**: TypeScript, JavaScript, Python, and more
- **Token estimation**: Calculate LLM token usage for better context management
- **Configuration File**: Set default options instead of writing every feature

## Installation

### Install from npm (Recommended)

Install globally to use the CLI tool from anywhere:

```bash
npm install -g @tajudeen/repo-context-packager
```

After installation, you can use the `repo-context-packager` command directly:

```bash
repo-context-packager --help
```

### Development Installation

To contribute or modify the tool, clone the repository and install dependencies:

```bash
git clone https://github.com/abdulgafar4/repo-context-packager.git
cd repo-context-packager
npm install
npm run build
```

## Testing
Run the test suites with Vitest:

- `npm test` – run the full test suite once.
- `npm run test:watch` – keep Vitest running and re-run tests on file changes.
- `npm run test:file -- src/utils.test.ts` – execute a single test file (replace the path as needed).
- `npm run test:run -- --filter "calculateTokens"` – run only tests matching a filter pattern.

## Usage

After installing via npm, use the `repo-context-packager` command (or `repo-context-packager` if installed globally):

### Package the current directory
```bash
repo-context-packager .
```

### Package a specific repo directory
```bash
repo-context-packager /path/to/repo
```

### Package specific files
```bash
repo-context-packager src/
```

### Package only JavaScript files
```bash
repo-context-packager . --include "*.js"
```

### Package with file size limit (under 10KB)
```bash
repo-context-packager . --max-file-size 10240
```

### Package with token estimation and limits
```bash
repo-context-packager . --tokens --max-tokens 50000
```

### Exclude certain file patterns
```bash
repo-context-packager . --exclude "*.log,*.tmp"
```

### Generate function summaries (85% smaller output)
```bash
repo-context-packager . --summary
```

### Combine summary mode with token estimation
```bash
repo-context-packager . --summary --tokens
```

### Specify custom output file
```bash
repo-context-packager . --output my-context.md
```

**Note:** If you installed via git clone for development, you can still use `npm start` instead of `repo-context-packager`.
## Configuration File

You can create a `.repoPackager.toml` file in your project root to set default options:
```toml
# Example configuration
output = "my-output.md"
verbose = false
tokens = true
exclude = "*.test.ts,*.spec.ts"
maxFileSize = 5000
```
## Output Modes

### Full Mode (Default)
Complete file contents with syntax highlighting:
```markdown
### File: src/utils.ts
```typescript
export async function collectFiles(repoPath: string): Promise<string[]> {
  // Full function implementation...
}
```

### Summary Mode (`--summary`)
Function signatures and key information only:
```markdown
### File: src/utils.ts
```typescript
// File contains 5 items, 111 lines
// Imports: glob, fs, path

export async function collectFiles(repoPath: string, include?: string[], exclude?: string[]): Promise<string[]>
export async function readFileContents(filePath: string): Promise<string>
export function formatOutput(content: string): string
```

## Output Structure
```
# Repository Context

## File System Location
/absolute/path/to/repo/being/analyzed

## Git Info
- Commit: <commit-sha>
- Branch: <branch-name>  
- Author: <author-name>
- Date: <commit-date>

## Structure
<project-structure>

## File Contents
<files-in-chosen-mode>

## Summary
- Total files: <file-count>
- Total lines: <line-count>
- Estimated tokens: <token-count> (if --tokens used)
```

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the Apache License - see the [LICENSE](LICENSE) file for details.
