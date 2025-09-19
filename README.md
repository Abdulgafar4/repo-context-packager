# Repository Context Packager

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

## Installation
To install the Repository Context Packager, clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd repo-context-packager
npm build
npm install
```

## Usage
You can use the tool from the command line as follows:

### Package the current directory
```bash
npm start .
```

### Package a specific repo directory
```bash
npm start /path/to/repo
```

### Package specific files
```bash
npm start src/
```

### Package only JavaScript files
```bash
npm start . --include "*.js"
```

### Package with file size limit (under 10KB)
```bash
npm start . --max-file-size 10240
```

### Package with token estimation and limits
```bash
npm start . --tokens --max-tokens 50000
```

### Exclude certain file patterns
```bash
npm start . --exclude "*.log,*.tmp"
```

### Generate function summaries (85% smaller output)
```bash
npm start . --summary
```

### Combine summary mode with token estimation
```bash
npm start . --summary --tokens
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
