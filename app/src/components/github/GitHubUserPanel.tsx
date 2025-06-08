import { createSignal, onMount } from "solid-js";
import type { GitHubUser } from "../../lib/github/GitHubLogin";
import {
  repositoryHref,
  parseOwnerRepoFromHref,
  getLocalHumanTimeString,
  getDefaultBranchFromHref,
  getFilePathFromHref,
  currentFileHref,
} from "../../lib/github/GitHubUtility";
import { comitToGitHub } from "../../lib/github/Depreciated";
import { commitMultipleFilesToBranch } from "../../lib/github/GitHubCommit";
import { database } from "../../lib/localStorage/database";

type Props = {
  user: GitHubUser;
  onLogout: () => void;
  token: string;
};

export const GitHubUserPanel = (props: Props) => {
  const [branchName, setBranchName] = createSignal("");
  const [status, setStatus] = createSignal<string | null>(null);
  const [baseBranch, setBaseBranch] = createSignal<string>("main");
  const [filePath, setFilePath] = createSignal<string | null>(null);

  onMount(async () => {
    const href = repositoryHref();
    if (href) {
      const branch = await getDefaultBranchFromHref(href, props.token);
      if (branch) setBaseBranch(branch);
    }
    setFilePath(getFilePathFromHref(currentFileHref()));
  });

  const handleCommit = async () => {
    setStatus("Committing...");

    // Save the current editor content to the database before committing
    const filePathValue = filePath();
    const content = window.__getEditorContent ? window.__getEditorContent() : "";

    if (filePathValue && content && database.isInitialised()) {
      await database.save("markdown", filePathValue, content);
    }

    // Now load all markdown files for the active repo
    let files: [string, string][] = [];
    try {
      files = (await database.loadAll<string>("markdown")).map(
        ([key, value]) => [key.toString(), value] as [string, string]
      );
    } catch (err) {
      setStatus("Failed to load files from database.");
      return;
    }

    if (files.length === 0) {
      setStatus("No files to commit.");
      return;
    }

    // Prepare commit info
    const now = new Date();
    const humanTime = getLocalHumanTimeString(now);
    const commitMsg = humanTime;
    const inputBranch = branchName().replace(/\s+/g, "-");
    const newBranch = inputBranch || `branch-${humanTime}`;
    const repoInfo = parseOwnerRepoFromHref(repositoryHref());
    if (!repoInfo) {
      setStatus("Repository link not found or invalid.");
      return;
    }

    // Commit each file
    const filesToCommit = files.map(([path, content]) => ({
      path,
      content,
    }));

    try {
      await commitMultipleFilesToBranch(
        repoInfo.owner,
        repoInfo.repo,
        newBranch,
        filesToCommit,
        commitMsg,
        props.token,
        baseBranch()
      );
      await database.clear("markdown"); // <-- Reset the markdown store after commit
      setStatus(
        `Committed ${filesToCommit.length} file(s) to branch ${newBranch} at ${commitMsg}. Please wait at least a minute before attempting to commit changes to the same files on the same branch!`
      );
    } catch (err) {
      setStatus("Failed to commit files: " + (err instanceof Error ? err.message : err));
    }
  };

  return (
    <div>
      <h2 class="text-xl font-bold mb-2">Logged in as {props.user.login}</h2>
      <div class="mt-6">
        <label class="block mb-1 font-semibold" for="branch-name">
          Branch name
        </label>
        <input
          id="branch-name"
          type="text"
          class="border p-2 w-full mb-2"
          placeholder="Enter branch name"
          value={branchName()}
          onInput={(e) => setBranchName(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCommit();
            }
          }}
        />
        <button
          class="bg-black text-white px-4 py-2 rounded w-full"
          onClick={handleCommit}
        >
          Commit
        </button>
        {status() && <div class="mt-2 text-center text-sm">{status()}</div>}
      </div>
      <button
        onClick={() => props.onLogout()}
        class="mt-4 bg-black text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
};
