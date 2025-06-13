import { Component, createSignal, onMount, For } from "solid-js";
import {
  repositoryHref,
  getFilePathFromHref,
  getCurrentFileHref,
} from "../../lib/github/GithubUtility";
import {
  getAllBranchesFromHref,
  getDefaultBranchFromHref,
} from "../../lib/github/GithubUtility";
import { database } from "../../lib/localStorage/database";
import { setCurrentBranch } from "../../lib/github/BranchSignal";

export const BranchDropdown: Component = () => {
  const [branches, setBranches] = createSignal<string[]>([]);
  const [branch, setBranch] = createSignal("main");
  const [showInput, setShowInput] = createSignal(false);
  const [newBranchName, setNewBranchName] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    const href = repositoryHref();
    if (href) {
      const fetchedBranches = await getAllBranchesFromHref(href);
      // Get local branches from storage
      const localBranches = JSON.parse(
        localStorage.getItem("localBranches") || "[]",
      );
      // Combine local branches and fetched branches, prioritizing local branches
      const allBranches = [
        ...localBranches,
        ...fetchedBranches.filter((b) => !localBranches.includes(b)),
      ];
      setBranches(allBranches);
      // Set current branch from localStorage or default to first branch
      const storedBranch = localStorage.getItem("currentBranch");
      if (storedBranch && allBranches.includes(storedBranch)) {
        setBranch(storedBranch);
        await database.setActiveBranch(storedBranch); // <-- add this
      } else if (allBranches.length > 0) {
        // Try to find the default/base branch, fallback to the first branch if not found
        let baseBranch = "main";
        const href = repositoryHref();
        if (href) {
          // Try to get the default branch from GitHub
          try {
            baseBranch =
              (await getDefaultBranchFromHref(href)) || allBranches[0];
          } catch {
            baseBranch = allBranches[0];
          }
        } else {
          baseBranch = allBranches[0];
        }
        setBranch(baseBranch);
        await database.setActiveBranch(baseBranch);
      }
    }
  });

  // When a branch is selected, update state and localStorage
  const handleSelect = async (b: string) => {
    const href = getCurrentFileHref();
    const filePath = getFilePathFromHref(href);
    const content = window.__getEditorMarkdown
      ? window.__getEditorMarkdown()
      : "";
    // console.log("Saved:", content, "to filePath:", filePath, "from href:", href);
    if (filePath && content && database.isInitialised()) {
      await database.save<string>("markdown", filePath, content);
    }
    setBranch(b);
    setCurrentBranch(b); // <-- update the signal
    localStorage.setItem("currentBranch", b);
    await database.setActiveBranch(b);
    setShowInput(false);
    setError(null);
  };

  // Add a new branch locally (not on GitHub)
  const handleAddLocalBranch = async () => {
    setError(null);
    const name = newBranchName().trim();
    if (!name) {
      setError("Branch name cannot be empty.");
      return;
    }
    if (branches().includes(name)) {
      // If branch exists, just switch to it
      handleSelect(name);
      setNewBranchName("");
      return;
    }
    setBranches([name, ...branches()]);
    handleSelect(name);
    // Save local branches
    const localBranches = JSON.parse(
      localStorage.getItem("localBranches") || "[]",
    );
    localStorage.setItem(
      "localBranches",
      JSON.stringify([name, ...localBranches]),
    );
    setNewBranchName("");
  };

  return (
    <div class="dropdown me-2">
      <button
        class="btn btn-outline-secondary border-0 dropdown-toggle d-flex align-items-center"
        type="button"
        id="branchDropdown"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <i
          class="bi bi-git"
          style={{ "font-size": "1.2em", "margin-right": "0.5em" }}
        />
        <span>{branch()}</span>
      </button>
      <ul
        class="dropdown-menu p-2"
        aria-labelledby="branchDropdown"
        style={{ "min-width": "220px" }}
      >
        <For each={branches()}>
          {(b) => (
            <li>
              <button
                class={`dropdown-item${b === branch() ? " active" : ""}`}
                type="button"
                onClick={() => handleSelect(b)}
              >
                {b}
              </button>
            </li>
          )}
        </For>
        <li>
          <hr class="dropdown-divider" />
        </li>
        <li>
          {!showInput() ? (
            <button
              class="dropdown-item text-primary"
              type="button"
              onClick={() => {
                setShowInput(true);
                setError(null);
                setNewBranchName("");
              }}
            >
              + Add local branch
            </button>
          ) : (
            <div class="px-2 py-1">
              <input
                type="text"
                class="form-control form-control-sm mb-1"
                placeholder="New branch name"
                value={newBranchName()}
                onInput={(e) => setNewBranchName(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddLocalBranch();
                  if (e.key === "Escape") setShowInput(false);
                }}
                autofocus
              />
              <div class="d-flex gap-1">
                <button
                  class="btn btn-sm btn-primary"
                  type="button"
                  onClick={handleAddLocalBranch}
                >
                  Add
                </button>
                <button
                  class="btn btn-sm btn-secondary"
                  type="button"
                  onClick={() => setShowInput(false)}
                >
                  Cancel
                </button>
              </div>
              {error() && <div class="text-danger small mt-1">{error()}</div>}
            </div>
          )}
        </li>
      </ul>
    </div>
  );
};
