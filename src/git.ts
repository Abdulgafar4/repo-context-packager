import { execSync } from 'child_process';
import path from 'path';
import { logWarning } from './logger';

export interface GitInfo {
    commit: string;
    branch: string;
    author: string;
    date: string;
}

export function getGitInfo(repoPath?: string): GitInfo | null {
    try {
        const resolvedPath = repoPath ? path.resolve(repoPath) : process.cwd();
        
        // Check if directory exists
        if (repoPath && !require('fs').existsSync(resolvedPath)) {
            logWarning(`Directory '${repoPath}' does not exist.`);
            return null;
        }
        
        const options = { cwd: resolvedPath, stdio: 'pipe' as const };
        
        // Check if it's a git repository first
        try {
            execSync('git rev-parse --git-dir', options);
        } catch {
            logWarning(`'${resolvedPath}' is not a git repository.`);
            return null;
        }
        
        const commit = execSync('git rev-parse HEAD', options).toString().trim();
        const branch = execSync('git rev-parse --abbrev-ref HEAD', options).toString().trim();
        const author = execSync('git log -1 --pretty=format:\'%an <%ae>\'', options).toString().trim();
        const date = execSync('git log -1 --format=%cd', options).toString().trim();

        return { commit, branch, author, date };
    } catch (error: any) {
        if (error.message.includes('not a git repository')) {
            logWarning('Not a git repository.');
        } else if (error.message.includes('bad revision')) {
            logWarning('Git repository has no commits.');
        } else {
            logWarning(`Unable to retrieve git information: ${error.message}`);
        }
        return null;
    }
}