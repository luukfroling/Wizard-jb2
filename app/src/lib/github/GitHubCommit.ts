
/**
 * Commits multiple files in a single commit to a branch.
 * @param owner Repository owner
 * @param repo Repository name
 * @param branch Branch to commit to
 * @param files Array of {path, content} objects
 * @param commitMsg Commit message
 * @param token GitHub personal access token
 * @throws Error if the commit fails
 */
export async function commitMultipleFilesToBranch(
    owner: string,
    repo: string,
    branch: string,
    files: { path: string; content: string; }[],
    commitMsg: string,
    token: string,
    baseBranch: string // Optionally specify a base branch for new branch creation
): Promise<void> {
    const headers: Record<string, string> = {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
    };

    // Check if the branch exists, create if not
    const branchSha = await ensureBranchAndGetSha(owner, repo, branch, baseBranch, token);

    // Get the tree SHA of the latest commit on the branch
    const baseTreeSha = await getTreeShaFromCommit(owner, repo, branchSha, token);

    // Create blobs for each file
    const blobs = await createBlobsForFiles(owner, repo, files, token);

    // Create a new tree with all blobs
    const treeSha = await createTreeWithBlobs(owner, repo, baseTreeSha, blobs, token);

    // Create a new commit with the new tree
    const commitSha = await createCommitWithTree(
        owner,
        repo,
        commitMsg,
        treeSha,
        branchSha,
        token
    );

    // Update the branch reference to point to the new commit
    await updateBranchRefToCommit(owner, repo, branch, commitSha, token);
}

/**
 * Ensures a branch exists (creating it from baseBranch if needed) and returns its latest commit SHA.
 * @param owner Repository owner
 * @param repo Repository name
 * @param branch Branch to check or create
 * @param baseBranch Branch to use as base if creating
 * @param token GitHub personal access token
 * @returns The latest commit SHA of the ensured branch
 * @throws Error if branch creation or SHA retrieval fails
 */
export async function ensureBranchAndGetSha(
    owner: string,
    repo: string,
    branch: string,
    baseBranch: string,
    token: string
): Promise<string> {
    const baseSha = await getBranchSha(owner, repo, baseBranch, token);
    const exists = await branchExists(owner, repo, branch, token);

    if (!exists) {
        await createBranch(owner, repo, branch, baseSha, token);
    }
    return await getBranchSha(owner, repo, branch, token);
}

/**
 * Gets the tree SHA of the latest commit on a branch.
 * @param owner Repository owner
 * @param repo Repository name
 * @param commitSha SHA of the latest commit on the branch
 * @param token GitHub personal access token
 * @returns The tree SHA string
 * @throws Error if the tree SHA cannot be retrieved
 */
export async function getTreeShaFromCommit(
    owner: string,
    repo: string,
    commitSha: string,
    token: string
): Promise<string> {
    const headers: Record<string, string> = {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
    };
    const commitResp = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/commits/${commitSha}`,
        { headers }
    );
    if (!commitResp.ok) throw new Error("Failed to get commit");
    const commitData = await commitResp.json();
    return commitData.tree.sha;
}

/**
 * Creates blobs for each file and returns an array of { path, sha }.
 * @param owner Repository owner
 * @param repo Repository name
 * @param files Array of { path, content } objects
 * @param token GitHub personal access token
 * @returns Array of { path, sha }
 * @throws Error if any blob creation fails
 */
export async function createBlobsForFiles(
    owner: string,
    repo: string,
    files: { path: string; content: string; }[],
    token: string
): Promise<{ path: string; sha: string; }[]> {
    const headers: Record<string, string> = {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
    };
    const blobs = [];
    for (const file of files) {
        const blobResp = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
            {
                method: "POST",
                headers,
                body: JSON.stringify({
                    content: file.content,
                    encoding: "utf-8",
                }),
            }
        );
        if (!blobResp.ok) throw new Error("Failed to create blob for " + file.path);
        const blobData = await blobResp.json();
        blobs.push({ path: file.path, sha: blobData.sha });
    }
    return blobs;
}

/**
 * Creates a new tree with the provided blobs.
 * @param owner Repository owner
 * @param repo Repository name
 * @param baseTreeSha The SHA of the base tree to build from
 * @param blobs Array of { path, sha }
 * @param token GitHub personal access token
 * @returns The new tree's SHA
 * @throws Error if the tree creation fails
 */
export async function createTreeWithBlobs(
    owner: string,
    repo: string,
    baseTreeSha: string,
    blobs: { path: string; sha: string; }[],
    token: string
): Promise<string> {
    const headers: Record<string, string> = {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
    };
    const treeResp = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees`,
        {
            method: "POST",
            headers,
            body: JSON.stringify({
                base_tree: baseTreeSha,
                tree: blobs.map((b) => ({
                    path: b.path,
                    mode: "100644",
                    type: "blob",
                    sha: b.sha,
                })),
            }),
        }
    );
    if (!treeResp.ok) throw new Error("Failed to create tree");
    const treeData = await treeResp.json();
    return treeData.sha;
}

/**
 * Creates a new commit with the given tree and parent commit.
 * @param owner Repository owner
 * @param repo Repository name
 * @param commitMsg Commit message
 * @param treeSha SHA of the tree to commit
 * @param parentSha SHA of the parent commit
 * @param token GitHub personal access token
 * @returns The new commit's SHA
 * @throws Error if the commit creation fails
 */
export async function createCommitWithTree(
    owner: string,
    repo: string,
    commitMsg: string,
    treeSha: string,
    parentSha: string,
    token: string
): Promise<string> {
    const headers: Record<string, string> = {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
    };
    const commitResp = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/commits`,
        {
            method: "POST",
            headers,
            body: JSON.stringify({
                message: commitMsg,
                tree: treeSha,
                parents: [parentSha],
            }),
        }
    );
    if (!commitResp.ok) throw new Error("Failed to create commit");
    const commitData = await commitResp.json();
    return commitData.sha;
}

/**
 * Updates the branch reference to point to the new commit SHA.
 * @param owner Repository owner
 * @param repo Repository name
 * @param branch Branch name to update
 * @param commitSha The new commit SHA to point the branch to
 * @param token GitHub personal access token
 * @throws Error if the update fails
 */
export async function updateBranchRefToCommit(
    owner: string,
    repo: string,
    branch: string,
    commitSha: string,
    token: string
): Promise<void> {
    const headers: Record<string, string> = {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
    };
    const updateResp = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
        {
            method: "PATCH",
            headers,
            body: JSON.stringify({ sha: commitSha }),
        }
    );
    if (!updateResp.ok) throw new Error("Failed to update branch ref");
}

/**
 * Checks whether a branch exists in the given GitHub repository.
 * @param owner The repository owner
 * @param repo The repository name
 * @param branch The branch name to check
 * @param token (optional) GitHub token for private repos or higher rate limits
 * @returns true if the branch exists, false otherwise
 */
export async function branchExists(
    owner: string,
    repo: string,
    branch: string,
    token?: string
): Promise<boolean> {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`;
    const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
    };
    if (token) {
        headers.Authorization = `token ${token}`;
    }

    const resp = await fetch(apiUrl, { headers });
    return resp.ok;
}

/**
 * Gets the latest commit SHA of a branch in a GitHub repository.
 * @param owner The repository owner
 * @param repo The repository name
 * @param branch The branch name
 * @param token GitHub token
 * @returns The SHA string
 * @throws Error if the SHA cannot be retrieved
 */
export async function getBranchSha(
    owner: string,
    repo: string,
    branch: string,
    token: string
): Promise<string> {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`;
    const headers: Record<string, string> = {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
    };
    const resp = await fetch(apiUrl, { headers });
    const refText = await resp.text();
    if (!resp.ok) throw new Error("Failed to get branch SHA: " + refText);
    const refData = JSON.parse(refText);
    return refData.object.sha;
}
/**
 * Creates a new branch in the given GitHub repository from a base SHA.
 * @param owner The repository owner
 * @param repo The repository name
 * @param newBranch The new branch name to create
 * @param baseSha The SHA to branch from (usually the base branch's latest commit)
 * @param token GitHub token
 * @throws Error if branch creation fails
 */

export async function createBranch(
    owner: string,
    repo: string,
    newBranch: string,
    baseSha: string,
    token: string
): Promise<void> {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs`;
    const headers: Record<string, string> = {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
    };
    const body = JSON.stringify({
        ref: `refs/heads/${newBranch}`,
        sha: baseSha,
    });

    const resp = await fetch(apiUrl, {
        method: "POST",
        headers,
        body,
    });
    if (!resp.ok) throw new Error("Failed to create branch");
}

