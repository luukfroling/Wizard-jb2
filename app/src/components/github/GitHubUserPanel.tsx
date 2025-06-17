import { createSignal, onMount, createEffect, For } from "solid-js";
import type { GitHubUser } from "../../lib/github/GithubLogin";
import {
  getFilePathFromHref,
  currentFileHref,
} from "../../lib/github/GithubUtility";
import { database } from "../../lib/localStorage/database";
import { github } from "../../lib/github/githubInteraction";
import { saveEditorContentToDatabase } from "../Editor";

type Props = {
  user: GitHubUser;
  onLogout: () => void;
  token: string;
};

export const [filePath, setFilePath] = createSignal<string | null>(null);
export const GitHubUserPanel = (props: Props) => {
  const [commitMsg, setCommitMsg] = createSignal("");
  const [status, setStatus] = createSignal<string | null>(null);
  const [availableFiles, setAvailableFiles] = createSignal<[string, string][]>(
    [],
  );
  const [selectedFiles, setSelectedFiles] = createSignal<Set<string>>(
    new Set(),
  );

  onMount(async () => {
    const currentPath = getFilePathFromHref(currentFileHref());
    setFilePath(currentPath);

    // Load all markdown files for the active repo
    const files = await database.loadAll<string>("markdown");
    setAvailableFiles(files.map(([key, value]) => [key.toString(), value]));
    setSelectedFiles(new Set<string>()); // <-- Start with no files selected
  });

  // Dynamically update availableFiles when the branch changes
  createEffect(() => {
    github.getBranch();
    database.loadAll<string>("markdown").then((files) => {
      setAvailableFiles(files.map(([key, value]) => [key.toString(), value]));
      setSelectedFiles(new Set<string>());
    });
  });

  // Reactively ensure the current file is always in the selection menu
  createEffect(() => {
    const current = filePath();
    const files = availableFiles();
    if (current && !files.some(([key]) => key === current)) {
      setAvailableFiles([[current, ""], ...files]);
      setSelectedFiles(new Set<string>());
    }
  });

  const handleCommit = async () => {
    setStatus("Committing...");

    // Save the current editor content to the database before committing
    console.log("saving before commiting...");
    await saveEditorContentToDatabase();

    if (selectedFiles().size == 0) {
      setStatus("No files selected.");
      return;
    }

    // Prepare commit info
    const inputCommitMsg = commitMsg().trim();
    if (!inputCommitMsg) {
      setStatus("Please enter a commit message.");
      return;
    }

    console.log(
      selectedFiles()
        .entries()
        .map(([a, _]) => a)
        .toArray(),
    );

    // Commit all files
    try {
      await github.commitMultipleFromDatabase(
        inputCommitMsg,
        selectedFiles()
          .entries()
          .map(([a, _]) => a)
          .toArray() as IDBValidKey[],
        "markdown",
      );
      setStatus(
        `Committed ${selectedFiles().size} file(s) to branch ${github.getBranch()} with message "${inputCommitMsg}". Please wait at least a minute before attempting to commit changes to the same files on the same branch!`,
      );
      setSelectedFiles(new Set<string>());
      setCommitMsg("");
    } catch (err) {
      setStatus(
        "Failed to commit files: " + (err instanceof Error ? err.message : err),
      );
    }
  };

  return (
    <div>
      <h2 class="text-xl font-bold mb-2">Logged in as {props.user.login}</h2>
      <div class="mt-6">
        <label class="block mb-1 font-semibold" for="commit-msg">
          Commit message
        </label>
        <input
          id="commit-msg"
          type="text"
          class="border p-2 w-full mb-2"
          placeholder="Enter commit message"
          value={commitMsg()}
          onInput={(e) => setCommitMsg(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCommit();
            }
          }}
        />

        {/* File selection submenu moved above the commit button */}
        <div class="mb-2">
          <label class="block font-semibold mb-1">
            Select files to commit:
          </label>
          <div
            class="border rounded p-2 bg-white overflow-y-auto"
            style={{ "max-height": "160px" }}
          >
            {availableFiles().length === 0 && (
              <div class="text-gray-500">No files in database.</div>
            )}
            {availableFiles().length > 0 && (
              <div class="mb-2">
                <label class="block cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={
                      selectedFiles().size === availableFiles().length &&
                      availableFiles().length > 0
                    }
                    onChange={(e) => {
                      if (e.currentTarget.checked) {
                        setSelectedFiles(
                          new Set(availableFiles().map(([key]) => key)),
                        );
                      } else {
                        setSelectedFiles(new Set<string>());
                      }
                    }}
                  />
                  <span class="ml-2">Select all</span>
                </label>
              </div>
            )}
            <For each={availableFiles()}>
              {([key]) => (
                <div class="mb-1">
                  <label class="block cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFiles().has(key)}
                      onChange={(e) => {
                        const newSet = new Set(selectedFiles());
                        if (e.currentTarget.checked) {
                          newSet.add(key);
                        } else {
                          newSet.delete(key);
                        }
                        setSelectedFiles(newSet);
                      }}
                    />
                    <span class="ml-2">{key}</span>
                  </label>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Status directly below the selection menu, no extra margin */}
        {status() && <div class="text-center text-sm">{status()}</div>}

        <div class="flex gap-8 mt-2">
          <button
            class="bg-black text-white px-4 py-2 rounded flex-1"
            onClick={handleCommit}
          >
            Commit
          </button>
          <button
            onClick={() => props.onLogout()}
            class="bg-black text-white px-4 py-2 rounded flex-1"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};
