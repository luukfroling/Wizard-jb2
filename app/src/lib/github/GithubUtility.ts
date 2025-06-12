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
 * Fetches all branch names from a GitHub repository.
 * @param href The repository URL (e.g. https://github.com/owner/repo)
 * @param token (optional) GitHub token for private repos or higher rate limits
 * @returns An array of branch names, or an empty array if none found
 */
export async function getAllBranchesFromHref(
    href: string,
    token?: string,
): Promise<string[]> {
    const repoInfo = parseOwnerRepoFromHref(href);
    if (!repoInfo) return [];
    const { owner, repo } = repoInfo;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`;
    const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
    };
    if (token) {
        headers.Authorization = `token ${token}`;
    }

    const resp = await fetch(apiUrl, { headers });
    if (!resp.ok) return [];
    const data = await resp.json();
    // Each branch object has a 'name' property
    return Array.isArray(data) ? data.map((b) => b.name) : [];
}

/**
 * Helper to fetch file content from a specific branch.
 */
export async function fetchFromBranch(
    owner: string,
    repo: string,
    filePath: string,
    branchName: string,
    token?: string,
): Promise<string | null> {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branchName)}`;
    const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3.raw",
    };
    if (token) {
        headers.Authorization = `token ${token}`;
    }
    const resp = await fetch(apiUrl, { headers });
    if (!resp.ok) return null;
    return await resp.text();
}

/**
 * Fetches the raw contents of a file from a GitHub repository for a specific branch.
 * If not found in the given branch, tries the default branch.
 */
export async function getFileContentFromRepo(
    owner: string,
    repo: string,
    branch: string,
    filePath: string,
    token?: string,
): Promise<string | null | undefined> {
    // Try to fetch from the given branch first
    const content = await fetchFromBranch(owner, repo, filePath, branch, token);
    if (content !== null) return content;

    // If not found, use getDefaultBranchFromHref to get the default branch
    const repoHref = `https://github.com/${owner}/${repo}`;
    const defaultBranch = await getDefaultBranchFromHref(repoHref, token);

    if (defaultBranch && defaultBranch !== branch) {
        return await fetchFromBranch(
            owner,
            repo,
            filePath,
            defaultBranch,
            token,
        );
    }

    return null;
}
