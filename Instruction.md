Overview
You are tasked with building a Repository Context Packager command-line tool that analyzes local git repositories and creates a text file containing repository content optimized for sharing with Large Language Models (LLMs).

When developers want to get help from ChatGPT or other LLMs about their code, they often struggle with how to share their codebase effectively. They might copy-paste individual files, but this loses important context about the project structure, dependencies, and relationships between files. Your tool will solve this by automatically collecting and formatting repository content into a single, well-structured text file that can be easily shared with any LLM.

Your tool will scan a local repository directory, collect relevant files and information, and output a formatted text document that includes:

Basic git information
Project structure overview
File contents with clear separators
Basic metadata
What You're Building
You are building a CLI tool that takes a repository (or parts of it) as input and outputs a formatted text file containing the repository's content in a structure that's easy for LLMs to understand.

Example Usage (assuming the tool is named tool-name until you pick a name):

# Package the current directory
tool-name .

# Package a specific repo directory
tool-name /home/student1/Seneca/major-project

# Package specific files
tool-name src/main.js src/utils.js

# Package with output file
tool-name . -o my-project-context.txt

# Package only JavaScript files
tool-name . --include "*.js"
Example Output Format:

# Repository Context

## File System Location

/absolute/path/to/repo/being/analyzed

## Git Info

- Commit: e45f8911e2ca40223faf2309bf1996443f2df336
- Branch: main
- Author: Kim Lee <kim.lee@email.com>
- Date: Thu Aug 28 16:07:19 2025 -0400

## Structure
```
src/
  main.js
  utils/
    helper.js
package.json
```

## File Contents

### File: package.json
```json
{
  "name": "my-project",
  "version": "1.0.0"
}
```

### File: src/main.js
```javascript
const helper = require('./utils/helper');

function main() {
  console.log('Hello World');
}
```

### File: src/utils/helper.js
```javascript
function formatString(str) {
  return str.trim();
}

module.exports = { formatString };
```

## Summary
- Total files: 3
- Total lines: 14
This first release is designed to expose you to the common workflows and tools involved in contributing to open source projects on GitHub. In order to give every student a similar learning experience, we will all be working on the same project.

Learning Goals
In addition to the actual code you will write, the ultimate goal of this first release is to help you gain experience in many aspects of open source development, specifically:

programming language by building a real-world tool
learning about file system operations, text processing, and CLI development
understanding repository structure and common development patterns
working with the basics of git, including branches, commits, etc.
creating open source projects on GitHub
writing about your own work via your Blog
Getting Started
Choose your programming language
Set up your GitHub repository
Implement basic CLI argument parsing
Add file/directory reading functionality
Implement the output format
Add git integration
Choose and implement 2 optional features
Features
Required Features (implement ALL)
To begin, your tool must include all of the following:

Project Setup: Create a GitHub repo with a clear name, LICENSE file using an approved open source license, and proper README.md file.

Basic CLI Interface:

--version or -v flag prints tool name and version
--help or -h flag prints usage information
Accept one or more file and directory paths as arguments
File Discovery: Your tool should be able to:

# Analyze current directory
tool-name .

# Analyze specific directory
tool-name ./src

# Analyze specific files
tool-name file1.js file2.py
Basic Output Format: Generate output that includes:

Absolute path to repo in the filesystem. All other paths can be relative to this.
If the directory is a git repo, include basic git information about the current commit (commit SHA, branch, author, date), otherwise "Not a git repository"
A project structure tree (showing directories and files). You can figure out the best way to represent this.
File contents with clear headers and separators
Basic summary statistics (file count, total lines, etc.)
Standard Streams:

Output the packaged content to stdout by default
Write errors, messages, and any debug info to stderr
File Reading: Read and include the contents of text files in the output package. For very large files (>16KB), consider truncating with a note about the truncation or come up with another way to "shorten" the file so that we can include some of it.

Error Handling: Handle permission and other errors gracefully, skipping files that can't be processed and note them in stderr. Provide helpful error messages for common issues.

Optional Features (implement at least 2)
Pick at least 2 of the following to implement:

Output to File:

tool-name . -o output.txt
tool-name . --output context-package.md
File Filtering by Extension:

# Only include JavaScript files
tool-name . --include "*.js"

# Include multiple extensions
tool-name . --include "*.js,*.py,*.md"
File Exclusion:

# Exclude test files
tool-name . --exclude "*test*"

# Exclude multiple patterns
tool-name . --exclude "*.log,node_modules,*.tmp"
Gitignore Integration: Automatically exclude files and directories listed in .gitignore

Token Counting: Provide estimated token counts using a simple approximation (e.g., ~4 characters per token for English text):

tool-name . --tokens
# Output: Estimated tokens: 1,247
Size Limits: Allow limiting output size:

# Limit to files under 1KB each
tool-name . --max-file-size 1024

# Stop when total output reaches ~4000 tokens
tool-name . --max-tokens 4000
Different Output Formats:

# Output as JSON
tool-name . --format json

# Output as YAML
tool-name . --format yaml

# Output as Markdown (default)
tool-name . --format markdown
Binary File Handling: Detect binary files (e.g., .jpg, .exe, .pdf, etc.) and either skip them or include just their metadata (filename, size, type)

Implementation Notes
Start simple: get basic file reading and directory traversal working first
Focus on text files initially (source code, documentation, config files)
Use your language's standard library for file operations when possible
Use existing libraries for features like glob patterns or tree display
Test with your own project directory as you build it
Getting Help
For this assignment, everyone must create their own project, but that doesn't mean you can't talk to your colleagues. At every stage of your work, make sure you ask for help, share ideas, and get feedback from others in the class. You're also welcome to program together and help each other and/or use AI to help solve problems. However, you are required to do the project yourself, since you will be extending and maintaining this code throughout the term. It's critical that you know how everything works and don't copy/paste code you don't understand and didn't write.

Requirements
You will be graded on the following:

GitHub Repo exists with LICENSE and README.md
README.md clearly explains what the tool does, how to install/run it, and includes examples
Source code implements all required features and works correctly
Source code implements at least 2 optional features
Code is well-organized with good naming and comments
Blog post documents your experience building the tool and links to your repo
Add Info to Table Below