import { execSync } from 'child_process';

export interface GitInfo {
    commit: string;
    branch: string;
    author: string;
    date: string;
}

export function getGitInfo(): GitInfo | null {
    try {
        const commit = execSync('git rev-parse HEAD').toString().trim();
        const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
        const author = execSync('git log -1 --pretty=format:\'%an <%ae>\'').toString().trim();
        const date = execSync('git log -1 --format=%cd').toString().trim();

        return { commit, branch, author, date };
    } catch (error) {
        console.error('Not a git repository or unable to retrieve git information.');
        return null;
    }
}