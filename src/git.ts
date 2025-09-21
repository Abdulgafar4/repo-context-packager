import { simpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs';

export interface GitInfo {
    commit: string;
    branch: string;
    author: string;
    date: string;
}

export async function getGitInfo(repoPath?: string): Promise<GitInfo | null> {
    try {
        const resolvedPath = repoPath ? path.resolve(repoPath) : process.cwd();
        
        // Check if directory exists
        if (repoPath && !fs.existsSync(resolvedPath)) {
            return null;
        }
        
        // Initialize simple-git with the repository path
        const git = simpleGit(resolvedPath);
        
        // Check if it's a git repository
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            return null;
        }
        
        // Get the latest commit log
        const log = await git.log(['-1']);
        if (!log.latest) {
            return null;
        }
        
        // Get branch
        const branch = await git.branch();
        
        return {
            commit: log.latest.hash,
            branch: branch.current,
            author: `${log.latest.author_name} <${log.latest.author_email}>`,
            date: log.latest.date
        };
    } catch (error) {
        return null;
    }
}