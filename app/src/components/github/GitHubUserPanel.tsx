import { createSignal, onMount } from "solid-js";
import type { GitHubUser } from "../../lib/github";
import {
  comitToGitHub,
  repositoryHref,
  parseOwnerRepoFromHref,
  getLocalHumanTimeString,
  getDefaultBranchFromHref,
  getFilePathFromHref,
  currentFileHref,
} from "../../lib/github";

type Props = {
  user: GitHubUser;
  onLogout: () => void;
  token: string;
  getEditorContent: () => string;
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
    const content = props.getEditorContent();

    // If filePath could not be determined, show an error and return
    const filePathValue = filePath();
    if (!filePathValue) {
      setStatus("Could not determine the current file path.");
      return;
    }

    // Commit message is now the current time
    const now = new Date();
    const humanTime = getLocalHumanTimeString(now);
    const commitMsg = humanTime;

    // Use the branch name from input, replacing all spaces with dashes, or the current time
    const inputBranch = branchName().replace(/\s+/g, "-");
    const newBranch = inputBranch || `branch-${humanTime}`;

    // Get owner/repo from repositoryHref
    const repoInfo = parseOwnerRepoFromHref(repositoryHref());
    if (!repoInfo) {
      setStatus("Repository link not found or invalid.");
      return;
    }

    try {
      const result = await comitToGitHub({
        token: props.token,
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        baseBranch: baseBranch(),
        newBranch,
        filePath: filePathValue,
        content,
        commitMsg,
      });
      setStatus(`Committed to branch ${result.branch} as ${result.filePath}`);
    } catch (err) {
      if (err instanceof Error) {
        setStatus(`Error: ${err.message}`);
      } else {
        setStatus("An unknown error occurred.");
      }
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
