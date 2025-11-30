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
        const resolvedPath = repoPath ? path.resolve(repoPath) : process.cwd();

        // Check if directory exists
        if (repoPath && !require('fs').existsSync(resolvedPath)) {
            process.stderr.write(`Warning: Directory '${repoPath}' does not exist.\n`);
            return null;
        }

        const options = { cwd: resolvedPath, stdio: 'pipe' as const };

        // Check if it's a git repository first
        try {
            execSync('git rev-parse --git-dir', options);
        } catch {
            process.stderr.write(`Warning: '${resolvedPath}' is not a git repository.\n`);
            return null;
        }

        const commit = execSync('git rev-parse HEAD', options).toString().trim();
        const branch = execSync('git rev-parse --abbrev-ref HEAD', options).toString().trim();
        const author = execSync('git log -1 --pretty=format:\'%an <%ae>\'', options).toString().trim();
        const date = execSync('git log -1 --format=%cd', options).toString().trim();

        return { commit, branch, author, date };
    } catch (error: any) {
        if (error.message.includes('not a git repository')) {
            process.stderr.write('Warning: Not a git repository.\n');
        } else if (error.message.includes('bad revision')) {
            process.stderr.write('Warning: Git repository has no commits.\n');
        } else {
            process.stderr.write(`Warning: Unable to retrieve git information: ${error.message}\n`);
        }
        return null;
    }
}

export function cloneRepository(url: string, targetDir: string): void {
    try {
        execSync(`git clone --depth 1 ${url} ${targetDir}`, { stdio: 'pipe' });
    } catch (error: any) {
        throw new Error(`Failed to clone repository: ${error.message}`);
    }
}