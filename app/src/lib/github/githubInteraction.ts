import { database, Database } from "../localStorage/database";
import { createSignal } from "solid-js";

interface RepoInfo {
    owner: string;
    default_branch: string;
}

interface BranchCommitInfo {
    sha: string;
    treeSha: string;
    parents: { sha: string }[];
}

class GitHubInteraction {
    private repo = "";
    private owner = "";
    private auth = "";
    private branch = "";

    public getBranch: () => string;
    public setBranch: (v: string) => void;
    public getRepo: () => string;
    public setRepo: (v: string) => void;
    public getOwner: () => string;
    public setOwner: (v: string) => void;
    public getAuth: () => string;
    public setAuth: (v: string) => void;

    constructor(repo: string, owner: string, auth: string, branch: string) {
        this.repo = repo;
        this.owner = owner;
        this.auth = auth;
        this.branch = branch;
        const [getRepoSignal, setRepoSignal] = createSignal(this.repo);
        this.getRepo = getRepoSignal;
        this.setRepo = setRepoSignal;
        const [getOwnerSignal, setOwnerSignal] = createSignal(this.owner);
        this.getOwner = getOwnerSignal;
        this.setOwner = setOwnerSignal;
        const [getAuthSignal, setAuthSignal] = createSignal(this.auth);
        this.getAuth = getAuthSignal;
        this.setAuth = setAuthSignal;
        const [getBranchSignal, setBranchSignal] = createSignal(this.branch);
        this.getBranch = getBranchSignal;
        this.setBranch = setBranchSignal;
    }

    private get headers(): Record<string, string> {
        return {
            Authorization: `token ${this.auth}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
        };
    }

    public async fetchFiles(filePaths: string[]): Promise<string[]> {
        try {
            return await this.fetchFilesFromBranch(filePaths, this.getBranch());
        } catch (e) {
            console.log(
                "unable to fetch file contents from current branch. " + e,
            );
        }
        try {
            const repoInfo = await this.fetchRepoInfo(
                this.getOwner(),
                this.getRepo(),
            );
            return await this.fetchFilesFromBranch(
                filePaths,
                repoInfo.default_branch,
            );
        } catch (e) {
            console.log(
                "unable to fetch file contents from default branch. " + e,
            );
        }
        throw new Error("Unable to fetch file contents.");
    }

    public async fetchFilesFromBranch(
        filePaths: string[],
        branchName: string,
    ): Promise<string[]> {
        const files: string[] = [];

        filePaths.forEach(async (filePath) => {
            files.push(await this.fetchFileFromBranch(filePath, branchName));
        });

        return files;
    }

    public async fetchFileFromBranch(
        filePath: string,
        branchName: string,
    ): Promise<string> {
        const url = `https://api.github.com/repos/${this.getOwner()}/${this.getRepo()}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branchName)}`;
        const header = this.headers;
        header.Accept = "application/vnd.github.v3.raw"; //why is this needed?
        const resp = await fetch(url, { headers: header });
        if (!resp.ok) {
            throw new Error(`Error getting file from "${filePath}"! \n`);
        }
        return await resp.text();
    }

    public async commitFiles<T>(
        message: string,
        files: [string, T][],
    ): Promise<void> {
        const { owner: owner, repo: repo, branch: branch } = this;

        const baseCommit = await this.ensureBranchCommit(owner, repo, branch);

        const treeCommit = await this.createTreeWithFiles(
            owner,
            repo,
            files,
            baseCommit,
        );

        const newCommit = await this.createCommitFromTree(
            owner,
            repo,
            message,
            treeCommit,
        );

        await this.updateBranchRef(owner, repo, branch, newCommit.sha);
    }

    public async commitFromDatabase<T>(
        message: string,
        key: IDBValidKey,
        store: string,
        database: Database,
    ): Promise<void> {
        const file = await database.load<T>(store, key);
        if (file === undefined) {
            throw new Error(
                `No file found under key "${key}" in store "${store}"`,
            );
        }
        if (file != undefined)
            await this.commitFiles<T>(message, [[key.toString(), file]]);
    }

    public async commitMultipleFromDatabase<T>(
        message: string,
        keys: IDBValidKey[],
        store: string,
    ): Promise<void> {
        const files = await database.loadMultiple<T>(store, keys);
        const foundKeys = new Set(files.map(([k]) => k.toString()));
        const missing = keys
            .map((k) => k.toString())
            .filter((k) => !foundKeys.has(k));
        if (missing.length) {
            throw new Error(`Missing files for keys: ${missing.join(", ")}`);
        }
        await this.commitFiles<T>(
            message,
            files.map((a: [IDBValidKey, T]) => [a[0].toString(), a[1]]),
        );
    }

    public async commitAllFromDatabase<T>(
        message: string,
        store: string,
    ): Promise<void> {
        const files = await database.loadAll<T>(store);
        if (!files.length) {
            throw new Error(`No files found in store "${store}"`);
        }
        await this.commitFiles<T>(
            message,
            files.map((a: [IDBValidKey, T]) => [a[0].toString(), a[1]]),
        );
    }

    private async ensureBranchCommit(
        owner: string,
        repo: string,
        branch: string,
    ): Promise<BranchCommitInfo> {
        const repoInfo = await this.fetchRepoInfo(owner, repo);
        let commit = await this.fetchBranchCommitInfo(owner, repo, branch);
        if (!commit) {
            await this.createBranch(
                owner,
                repo,
                branch,
                repoInfo.default_branch,
            );
            commit = await this.fetchBranchCommitInfo(owner, repo, branch);
            if (!commit) {
                throw new Error(
                    "Branch creation failed; could not load commit info.",
                );
            }
        }
        return commit;
    }

    private updateTreeInfo(
        base: BranchCommitInfo,
        newTreeSha: string,
    ): BranchCommitInfo {
        return {
            sha: base.sha,
            treeSha: newTreeSha,
            parents: [{ sha: base.sha }],
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private updateCommitInfo(response: any): BranchCommitInfo {
        return {
            sha: response.sha,
            treeSha: response.tree.sha,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            parents: response.parents.map((p: any) => ({ sha: p.sha })),
        };
    }

    public async fetchRepoInfo(owner: string = this.getOwner(), repo: string = this.getRepo()): Promise<RepoInfo> {
        const resp = await fetch(
            `https://api.github.com/repos/${owner}/${repo}`,
            { headers: this.headers },
        );
        if (!resp.ok) {
            throw new Error(
                `Failed to load repo info: ${resp.status} ${await resp.text()}`,
            );
        }
        return resp.json();
    }

    private async fetchBranchCommitInfo(
        owner: string,
        repo: string,
        branch: string,
    ): Promise<BranchCommitInfo | undefined> {
        const resp = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`,
            { headers: this.headers },
        );
        if (resp.status === 404) return undefined;
        if (!resp.ok) {
            throw new Error(`Error loading branch: ${resp.status}`);
        }
        const data = await resp.json();
        return {
            sha: data.commit.sha,
            treeSha: data.commit.commit.tree.sha,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            parents: data.commit.parents.map((p: any) => ({ sha: p.sha })),
        };
    }

    private async createBranch(
        owner: string,
        repo: string,
        branch: string,
        base: string,
    ): Promise<void> {
        const resp = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/refs`,
            {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({
                    ref: `refs/heads/${branch}`,
                    sha: base,
                }),
            },
        );
        if (!resp.ok) {
            throw new Error(
                `Create branch failed: ${resp.status} ${await resp.text()}`,
            );
        }
    }

    private async createTreeWithFiles<T>(
        owner: string,
        repo: string,
        files: [string, T][],
        base: BranchCommitInfo,
    ): Promise<BranchCommitInfo> {
        const entries = files.map(([path, content]) => ({
            path,
            mode: "100644",
            type: "blob",
            content:
                typeof content === "string" ? content : JSON.stringify(content),
        }));
        const resp = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/trees`,
            {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({
                    base_tree: base.treeSha,
                    tree: entries,
                }),
            },
        );
        if (!resp.ok) {
            throw new Error(
                `Tree creation failed: ${resp.status} ${await resp.text()}`,
            );
        }
        const data = await resp.json();
        return this.updateTreeInfo(base, data.tree.sha);
    }

    private async createCommitFromTree(
        owner: string,
        repo: string,
        message: string,
        base: BranchCommitInfo,
    ): Promise<BranchCommitInfo> {
        const resp = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/commits`,
            {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({
                    message,
                    tree: base.treeSha,
                    parents: base.parents.map((p) => p.sha),
                }),
            },
        );
        if (!resp.ok) {
            throw new Error(
                `Commit creation failed: ${resp.status} ${await resp.text()}`,
            );
        }
        const data = await resp.json();
        return this.updateCommitInfo(data);
    }

    private async updateBranchRef(
        owner: string,
        repo: string,
        branch: string,
        sha: string,
    ): Promise<void> {
        const resp = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
            {
                method: "PATCH",
                headers: this.headers,
                body: JSON.stringify({ sha }),
            },
        );
        if (!resp.ok) {
            throw new Error(
                `Update ref failed: ${resp.status} ${await resp.text()}`,
            );
        }
    }
}


// Create & configure your one instance:
export const github = new GitHubInteraction(
  /* initialRepo */  "",
  /* initialOwner */ "",
  /* initialAuth */  "",
  /* initialBranch */ ""
);