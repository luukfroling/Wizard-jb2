import { createSignal, onMount, createEffect } from "solid-js";

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
