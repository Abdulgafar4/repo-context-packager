import { execSync } from 'child_process';
import path from 'path';

export interface GitInfo {
    commit: string;
    branch: string;
    author: string;
    date: string;
}

export function getGitInfo(repoPath?: string): GitInfo | null {
    try {
        const options = repoPath ? { cwd: path.resolve(repoPath) } : {};
        
        const commit = execSync('git rev-parse HEAD', options).toString().trim();
        const branch = execSync('git rev-parse --abbrev-ref HEAD', options).toString().trim();
        const author = execSync('git log -1 --pretty=format:\'%an <%ae>\'', options).toString().trim();
        const date = execSync('git log -1 --format=%cd', options).toString().trim();

        return { commit, branch, author, date };
    } catch (error) {
        // Write to stderr instead of console.error for CLI tools
        process.stderr.write('Warning: Not a git repository or unable to retrieve git information.\n');
        return null;
    }
}