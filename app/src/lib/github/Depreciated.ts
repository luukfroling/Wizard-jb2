/**
 * Fetches the content of a file from a specific branch in a GitHub repository.
 * @param owner Repository owner
 * @param repo Repository name
 * @param path Path to the file in the repository (e.g. "README.md" or "src/index.ts")
 * @param branch Branch name to fetch the file from
 * @param token (optional) GitHub token for private repos or higher rate limits
 * @returns An object with content (base64-encoded) and encoding, or null if not found
 */

import { getBranchSha, branchExists, createBranch } from "./GitHubCommit";

export async function getFileFromBranch(
    owner: string,
    repo: string,
    path: string,
    branch: string,
    token?: string,
): Promise<{ content: string; encoding: string; sha: string } | null> {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
    const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
    };
    if (token) {
        headers.Authorization = `token ${token}`;
    }
    const resp = await fetch(url, { headers });
    if (!resp.ok) return null;
    const data = await resp.json();
    return { content: data.content, encoding: data.encoding, sha: data.sha };
}

/**
 * Commits a file to a specific branch in a GitHub repository.
 * If the branch does not exist, it will be created from the base branch.
 * @param token GitHub personal access token
 * @param owner Repository owner
 * @param repo Repository name
 * @param baseBranch Base branch to create the new branch from
 * @param newBranch Name of the new branch to commit to
 * @param filePath Path of the file to commit
 * @param content Content of the file to commit
 * @param commitMsg Commit message
 * @returns The branch name and file path where the content was committed
 */
export async function comitToGitHub({
    token,
    owner,
    repo,
    baseBranch,
    newBranch,
    filePath,
    content,
    commitMsg,
}: {
    token: string;
    owner: string;
    repo: string;
    baseBranch: string;
    newBranch: string;
    filePath: string;
    content: string;
    commitMsg: string;
}): Promise<{ branch: string; filePath: string }> {
    // 1. Get the SHA of the base branch
    const baseSha = await getBranchSha(owner, repo, baseBranch, token);

    // --- Check if the branch already exists ---
    const exists = await branchExists(owner, repo, newBranch, token);

    // 2. Create a new branch from the base branch only if it doesn't exist
    if (!exists) {
        await createBranch(owner, repo, newBranch, baseSha, token);
    }

    // 3. Commit the file to the branch (existing or newly created)
    await commitFileToBranch(
        owner,
        repo,
        newBranch,
        filePath,
        content,
        commitMsg,
        token,
    );

    return { branch: newBranch, filePath };
}

/**
 * Commits a file to a specific branch in a GitHub repository.
 * If the file exists, it updates the file (requires the file's SHA).
 * If the file does not exist, it creates a new file.
 * If a file has been committed to a branch recently, the Github API requires
 * the latest SHA of the file to be provided in the commit request. That causes
 * the commit to fail shortly after the first commit. The mean time between
 * commits is about 1 - 1.5 minutes.
 * @param owner Repository owner
 * @param repo Repository name
 * @param branch Branch to commit to
 * @param filePath Path of the file to commit
 * @param content Content of the file to commit
 * @param commitMsg Commit message
 * @param token GitHub personal access token
 * @throws Error if the commit fails
 */
export async function commitFileToBranch(
    owner: string,
    repo: string,
    branch: string,
    filePath: string,
    content: string,
    commitMsg: string,
    token: string,
): Promise<void> {
    const headers: Record<string, string> = {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
    };

    // Always fetch the latest SHA before committing
    let sha: string | undefined = undefined;
    try {
        const file = await getFileFromBranch(
            owner,
            repo,
            filePath,
            branch,
            token,
        );
        if (file && file.sha) {
            sha = file.sha;
        }
    } catch {
        sha = undefined;
    }

    const body: {
        message: string;
        content: string;
        branch: string;
        sha?: string;
    } = {
        message: commitMsg,
        content: btoa(unescape(encodeURIComponent(content))),
        branch,
    };
    if (sha) {
        body.sha = sha;
    }

    const resp = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
        {
            method: "PUT",
            headers,
            body: JSON.stringify(body),
        },
    );
    if (!resp.ok) throw new Error("Failed to commit file");
}
