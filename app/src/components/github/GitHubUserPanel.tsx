import { createSignal } from "solid-js";
import type { GitHubUser } from "../../lib/github";
import { commitToGitHubFile } from "../../lib/github";

type Props = {
  user: GitHubUser;
  onLogout: () => void;
  token: string;
  owner: string;
  repo: string;
  baseBranch: string;
  getEditorContent: () => string;
};

export const GitHubUserPanel = (props: Props) => {
  const [commitMessage, setCommitMessage] = createSignal("");
  const [status, setStatus] = createSignal<string | null>(null);

  const handleCommit = async () => {
    setStatus("Committing...");
    const filePath = `editor-content-${Date.now()}.txt`;
    const content = props.getEditorContent();
    const commitMsg = commitMessage() || "New commit";

    try {
      const result = await commitToGitHubFile({
        token: props.token,
        owner: props.owner,
        repo: props.repo,
        baseBranch: props.baseBranch,
        filePath,
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
      <p>ID: {props.user.id}</p>
      <div class="mt-6">
        <label class="block mb-1 font-semibold" for="commit-message">
          Commit message
        </label>
        <input
          id="commit-message"
          type="text"
          class="border p-2 w-full mb-2"
          placeholder="Enter commit message"
          value={commitMessage()}
          onInput={(e) => setCommitMessage(e.currentTarget.value)}
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
