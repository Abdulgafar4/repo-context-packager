import fs from 'fs';
import path from 'path';
import { RepoInfo, FileInfo } from './types';
import { getGitInfo } from './git';
import { collectFiles, readFileContents } from './utils';

export class Packager {
    private repoPath: string;
    private repoInfo: RepoInfo;
    private include?: string[];
    private exclude?: string[];
    private tokens: boolean;
    private maxFileSize?: number;
    private maxTokens?: number;

    constructor(repoPath: string, options: { include?: string[], exclude?: string[], tokens?: boolean, maxFileSize?: number, maxTokens?: number } = {}) {
        this.repoPath = repoPath;
        this.include = options.include;
        this.exclude = options.exclude;
        this.tokens = options.tokens || false;
        this.maxFileSize = options.maxFileSize;
        this.maxTokens = options.maxTokens;
        this.repoInfo = {
            gitInfo: null,
            files: [],
            totalFiles: 0,
            totalLines: 0,
            totalTokens: 0,
        };
    }

    public async analyzeRepository(): Promise<void> {
        this.repoInfo.gitInfo = await getGitInfo(this.repoPath);
        
        const filePaths = await collectFiles(this.repoPath, this.include, this.exclude);
        
        const fileInfos: FileInfo[] = [];
        let currentTokens = 0;

        for (const filePath of filePaths) {
            const fullPath = path.join(this.repoPath, filePath);
            const stats = await fs.promises.stat(fullPath);

            if (this.maxFileSize && stats.size > this.maxFileSize) {
                continue;
            }

            const content = await readFileContents(fullPath);
            const lines = content.split('\n').length;
            const fileTokens = Math.round(content.length / 4);

            if (this.maxTokens && (currentTokens + fileTokens) > this.maxTokens) {
                break;
            }
            
            currentTokens += fileTokens;
            fileInfos.push({ path: filePath, content, lines, size: stats.size });
        }
        
        this.repoInfo.files = fileInfos;
        this.repoInfo.totalFiles = this.repoInfo.files.length;
        this.repoInfo.totalLines = this.calculateTotalLines(this.repoInfo.files);
        this.repoInfo.totalTokens = this.calculateTotalTokens(this.repoInfo.files);
    }

    private calculateTotalLines(files: FileInfo[]): number {
        return files.reduce((total, file) => total + file.content.split('\n').length, 0);
    }

    private calculateTotalTokens(files: FileInfo[]): number {
        return Math.round(files.reduce((total, file) => total + file.content.length / 4, 0));
    }

    public getRepoInfo(): RepoInfo {
        return this.repoInfo;
    }

    public generatePackage(): string {
        let output = `# Repository Context\n\n`;
        output += `## File System Location\n\n${path.resolve(this.repoPath)}\n\n`;

        if (this.repoInfo.gitInfo) {
            output += `## Git Info\n\n`;
            output += `- Commit: ${this.repoInfo.gitInfo.commit}\n`;
            output += `- Branch: ${this.repoInfo.gitInfo.branch}\n`;
            output += `- Author: ${this.repoInfo.gitInfo.author}\n`;
            output += `- Date: ${this.repoInfo.gitInfo.date}\n\n`;
        } else {
            output += `## Git Info\n\nNot a git repository.\n\n`;
        }

        output += `## Structure\n\n\
${this.generateFileTree()}
\
\n`;

        output += `## File Contents\n\n`;
        for (const file of this.repoInfo.files) {
            output += `### File: ${file.path}\n`;
            output += `\
${file.content}
\
\n`;
        }

        output += `## Summary\n\n`;
        output += `- Total files: ${this.repoInfo.totalFiles}\n`;
        output += `- Total lines: ${this.repoInfo.totalLines}\n`;
        if (this.tokens) {
            output += `- Estimated tokens: ${this.repoInfo.totalTokens}\n`;
        }

        return output;
    }

    private generateFileTree(): string {
        const root = {};
        for (const file of this.repoInfo.files) {
            const parts = file.path.split(path.sep);
            let node = root;
            for (const part of parts) {
                node[part] = node[part] || {};
                node = node[part];
            }
        }

        const generateTree = (node, prefix = '') => {
            let result = '';
            const entries = Object.keys(node);
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                const isLast = i === entries.length - 1;
                const connector = isLast ? '└── ' : '├── ';
                result += `${prefix}${connector}${entry}\n`;
                if (Object.keys(node[entry]).length > 0) {
                    const newPrefix = prefix + (isLast ? '    ' : '│   ');
                    result += generateTree(node[entry], newPrefix);
                }
            }
            return result;
        };

        return generateTree(root).trim();
    }
}