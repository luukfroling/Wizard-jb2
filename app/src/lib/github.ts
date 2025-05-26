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
    filePath,
    content,
    commitMsg,
}: {
    token: string;
    owner: string;
    repo: string;
    baseBranch: string;
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

    // 2. Create the new branch ref
    const newBranch = `branch-${Date.now()}`;
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

    // 3. Commit the file to the new branch
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
