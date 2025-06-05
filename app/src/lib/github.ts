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

export async function commitToGitHubFile({
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
    const authHeader = (token: string) => ({
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
    });

    // 1. Get the SHA of the base branch
    const refResp = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`,
        { headers: authHeader(token) },
    );
    // refText is purely for debugging purposes
    const refText = await refResp.text();
    console.log(refText);
    if (!refResp.ok)
        throw new Error("Failed to get base branch SHA: " + refText);
    const refData = JSON.parse(refText);
    const baseSha = refData.object.sha;

    // --- Check if the branch already exists ---
    const exists = await branchExists(owner, repo, newBranch, token);

    // 2. Create a new branch from the base branch only if it doesn't exist
    if (!exists) {
        const createResp = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/refs`,
            {
                method: "POST",
                headers: authHeader(token),
                body: JSON.stringify({
                    ref: `refs/heads/${newBranch}`,
                    sha: baseSha,
                }),
            },
        );
        if (!createResp.ok) throw new Error("Failed to create branch");
    }

    // 3. Commit the file to the branch (existing or newly created)
    const commitResp = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
        {
            method: "PUT",
            headers: authHeader(token),
            body: JSON.stringify({
                message: commitMsg,
                content: btoa(unescape(encodeURIComponent(content))),
                branch: newBranch,
            }),
        },
    );
    if (!commitResp.ok) throw new Error("Failed to commit file");

    return { branch: newBranch, filePath };
}

export const [repositoryHref, setRepositoryHref] = createSignal<string | null>(null);

export function getRepositoryLink(): string | null {
    const anchor = document.querySelector<HTMLAnchorElement>('a.btn-source-repository-button');
    if (anchor) {
        setRepositoryHref(anchor.href);
        console.log("Repository link:", anchor.href);
        return anchor.href;
    } else {
        console.warn("Source repository link not found.");
        setRepositoryHref(null);
        return null;
    }
}

export function parseOwnerRepoFromHref(href: string | null): { owner: string; repo: string } | null {
    if (!href) return null;
    // Example: https://github.com/owner/repo
    const match = href.match(/github\.com\/([^\/]+)\/([^\/]+)/);
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
    token?: string
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



