import { createSignal } from "solid-js";

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


