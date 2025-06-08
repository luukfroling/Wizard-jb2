import { createSignal, createEffect, onMount } from "solid-js";

export type GitHubUser = {
    login: string;
    id: number;
    avatar_url?: string;
};

const getUserInfo = async (token: string): Promise<GitHubUser> => {
    const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to fetch user info");

    return res.json();
};

export function useGitHubAuth() {
    const [token, setToken] = createSignal<string | null>(null);
    const [user, setUser] = createSignal<GitHubUser | null>(null);

    onMount(() => {
        const saved = localStorage.getItem("gh_token");
        if (saved) setToken(saved);
    });

    createEffect(() => {
        const t = token();
        if (t) {
            getUserInfo(t)
                .then(setUser)
                .catch((err) => {
                    console.error(err);
                    localStorage.removeItem("gh_token");
                    setToken(null);
                });
        }
    });

    const logout = () => {
        localStorage.removeItem("gh_token");
        setToken(null);
        setUser(null);
    };

    return { token, setToken, user, setUser, logout };
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
    token: string,
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
    token: string,
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

export const [repositoryHref, setRepositoryHref] = createSignal<string | null>(
    null,
);

export function getRepositoryLink(): string | null {
    const anchor = document.querySelector<HTMLAnchorElement>(
        "a.btn-source-repository-button",
    );
    if (anchor) {
        setRepositoryHref(anchor.href);
        console.log("Repository link:", anchor.href);
        return anchor.href;
    } else {
        // Only happens when a link to a GitHub repository is not found
        console.warn("Source repository link not found.");
        setRepositoryHref(null);
        return null;
    }
}

export function parseOwnerRepoFromHref(
    href: string | null,
): { owner: string; repo: string } | null {
    if (!href) return null;
    // Example: https://github.com/owner/repo
    const match = href.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
        return { owner: match[1], repo: match[2] };
    }
    return null;
}

/**
 * Given a GitHub repository URL, fetches the default branch name.
 * @param href The repository URL (e.g. https://github.com/owner/repo)
 * @param token (optional) GitHub token for private repos or higher rate limits
 * @returns The default branch name, or null if not found
 */
export async function getDefaultBranchFromHref(
    href: string,
    token?: string,
): Promise<string | null> {
    const repoInfo = parseOwnerRepoFromHref(href);
    if (!repoInfo) return null;

    const { owner, repo } = repoInfo;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
    };
    if (token) {
        headers.Authorization = `token ${token}`;
    }

    const resp = await fetch(apiUrl, { headers });
    if (!resp.ok) return null;

    const data = await resp.json();
    return data.default_branch ?? null;
}

/**
 * Fetches the content of a file from a specific branch in a GitHub repository.
 * @param owner Repository owner
 * @param repo Repository name
 * @param path Path to the file in the repository (e.g. "README.md" or "src/index.ts")
 * @param branch Branch name to fetch the file from
 * @param token (optional) GitHub token for private repos or higher rate limits
 * @returns An object with content (base64-encoded) and encoding, or null if not found
 */
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
    token?: string,
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
 * Returns a human-readable local time string with timezone, suitable for branch or commit names.
 * Example: 2024-06-06T16-23-45+02:00
 */
export function getLocalHumanTimeString(date: Date = new Date()): string {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const min = pad(date.getMinutes());
    const sec = pad(date.getSeconds());

    // Timezone offset in minutes, e.g. +120 for UTC+2
    const tzOffsetMin = date.getTimezoneOffset();
    const tzSign = tzOffsetMin <= 0 ? "+" : "-";
    const absOffset = Math.abs(tzOffsetMin);
    const tzHour = pad(Math.floor(absOffset / 60));
    const tzMin = pad(absOffset % 60);
    const tzString = `${tzSign}${tzHour}:${tzMin}`;

    // Example: 2024-06-06T16-23-45+02:00
    return `${year}-${month}-${day}T${hour}-${min}-${sec}${tzString}`;
}

export const [currentFileHref, setCurrentFileHref] = createSignal<
    string | null
>(null);

export function getCurrentFileHref(): string | null {
    const anchor = document.querySelector<HTMLAnchorElement>(
        "a.btn-source-edit-button",
    );
    if (anchor) {
        setCurrentFileHref(anchor.href);
        console.log("Current file:", anchor.href);
        return anchor.href;
    } else {
        // In theory, this should never happen
        console.warn("Current file link not found.");
        setCurrentFileHref(null);
        return null;
    }
}

/**
 * Extracts the file path from a GitHub file URL.
 * Supports both /blob/<branch>/ and /edit/<branch>/ URLs.
 * Returns the path part after /blob/<branch>/ or /edit/<branch>/ in the GitHub URL,
 * or null if not available or not matched.
 * @param href The GitHub file URL to extract the file path from
 */
export function getFilePathFromHref(href: string | null): string | null {
    if (!href) return null;
    // Match both /blob/<branch>/ and /edit/<branch>/ patterns
    const match = href.match(
        /github\.com\/[^/]+\/[^/]+\/(?:blob|edit)\/[^/]+\/(.+)$/,
    );
    const filePath = match ? match[1] : null;
    console.log("Extracted file path:", filePath);
    return filePath;
}
