import { createSignal } from "solid-js";
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
      <div
        class={`dropdown-menu dropdown-menu-end p-3${open() ? " show" : ""}`}
        style={{ "min-width": "235px", left: "auto", right: 0 }}
      >
        <GitHubAuthPanel
          token={github.getAuth()}
          user={user()}
          onLogout={logout}
        />
      </div>
    </div>
  );
};
