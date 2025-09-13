# Repository Context Packager

## Overview
The Repository Context Packager is a command-line tool designed to analyze local git repositories and create a structured text file containing repository content optimized for sharing with Large Language Models (LLMs). This tool helps developers effectively share their codebase with LLMs by providing context about project structure, dependencies, and relationships between files.

## Features
- Analyzes local git repositories.
- Collects and formats repository information, including:
  - Basic git information (commit, branch, author, date).
  - Project structure overview.
  - File contents with clear separators.
  - Basic metadata and summary statistics.

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
npm start src/main.js src/utils.js
```

### Package with output file
```bash
npm start . -o my-project-context.txt
```

### Package only JavaScript files
```bash
npm start . --include "*.js"
```

## Output Format
The output will be structured as follows:

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

### File: <file-name>
<file-content>

## Summary
- Total files: <file-count>
- Total lines: <line-count>
```

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the Apache License - see the [LICENSE](LICENSE) file for details.
