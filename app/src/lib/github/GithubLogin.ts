import { createSignal, onMount, createEffect } from "solid-js";
import { github } from "./githubInteraction";

/**
 * Represents a GitHub user retrieved via the API.
 * @property login - The user's login/username.
 * @property id - The user's unique numeric ID.
 * @property avatar_url - Optional URL to the user's avatar image.
 */
export type GitHubUser = {
    login: string;
    id: number;
    avatar_url?: string;
};

/**
 * Fetches the authenticated GitHub user's profile information.
 *
 * @param token - A valid GitHub OAuth or personal access token.
 * @returns A promise resolving to the authenticated user's info.
 * @throws Error if the HTTP response is not OK.
 */
const getUserInfo = async (token: string): Promise<GitHubUser> => {
    const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to fetch user info");

    return res.json();
};

/**
 * Custom Solid.js hook for GitHub authentication state management.
 * @returns An object containing:
 *   - user: getter for the current GitHubUser or null.
 *   - setUser: setter to update the user manually.
 *   - logout: function to clear stored token and user.
 */
export function useGitHubAuth() {
    // Signal to hold the fetched GitHub user data
    const [user, setUser] = createSignal<GitHubUser | null>(null);

    // Run once when useGitHubAuth() is first used in a component.
    onMount(() => {
        // Attempt to retrieve previously saved token from localStorage.
        const saved = localStorage.getItem("gh_token"); // TODO store in database instead.
        if (saved) github.setAuth(saved);
    });

    // createEffect tracks changes to `token()` and runs the effect
    createEffect(() => {
        const t = github.getAuth();
        if (t) {
            // If there's a valid token, fetch user info.
            getUserInfo(t)
                .then(setUser)
                // Update the user signal on success.
                .catch((err) => {
                    // On error (e.g. invalid token), clear storage and signals.
                    console.error(err);
                    localStorage.removeItem("gh_token");
                    github.setAuth("");
                });
        } else {
            // If token is null, ensure user is also null.
            setUser(null);
        }
    });

    /**
     * Logs the user out by clearing token and user signals and localStorage.
     */
    const logout = () => {
        localStorage.removeItem("gh_token");
        github.setAuth("");
        setUser(null);
    };

    return { user, logout };
}
