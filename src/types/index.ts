export interface FileInfo {
    path: string;
    size: number;
    lines: number;
    content: string;
}

export interface GitInfo {
    commit: string;
    branch: string;
    author: string;
    date: string;
}

export interface RepoInfo {
    gitInfo: GitInfo | null;
    files: FileInfo[];
    totalFiles: number;
    totalLines: number;
    totalTokens: number;
    totalCharacters: number;
    directoriesProcessed: number;
    fileTypes: Record<string, number>;
    largestFile: { path: string; lines: number } | null;
    averageFileSize: number;
}