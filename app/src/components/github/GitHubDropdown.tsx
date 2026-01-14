import { createSignal, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { useGitHubAuth } from "../../lib/github/GithubLogin";
import { GitHubAuthPanel } from "./GitHubAuthPanel";
import { github } from "../../lib/github/githubInteraction";

export const GitHubDropdown = () => {
  const [open, setOpen] = createSignal(false);
  const { user, logout } = useGitHubAuth();

  return (
    <div class="dropdown ms-auto" style={{ "margin-left": "auto" }}>
      <button
        class="btn btn-sm dropdown-toggle d-flex align-items-center"
        type="button"
        onClick={() => setOpen(!open())}
        aria-expanded={open()}
      >
        <i class="bi bi-github fs-5" />
        {/* Remove or comment out the span below */}
        {/* <span class="ms-2">GitHub</span> */}
      </button>
      <Show when={open()}>
        <Portal>
          <div class="github-popup-backdrop" onClick={() => setOpen(false)}>
            <div
              class="github-popup-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div class="github-popup-header">
                <div class="github-popup-title">
                  <i class="bi bi-github me-2" />
                  GitHub
                </div>
                <button
                  class="github-popup-close"
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <i class="bi bi-x-lg" />
                </button>
              </div>
              <GitHubAuthPanel
                token={github.getAuth()}
                user={user()}
                onLogout={() => {
                  logout();
                  setOpen(false);
                }}
              />
            </div>
          </div>
        </Portal>
      </Show>
    </div>
  );
};
