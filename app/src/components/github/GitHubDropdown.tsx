import { createSignal } from "solid-js";
import { useGitHubAuth } from "../../lib/github";
import { GitHubAuthPanel } from "./GitHubAuthPanel";

export const GitHubDropdown = () => {
  const [open, setOpen] = createSignal(false);
  const { token, setToken, user, logout } = useGitHubAuth();

  return (
    <div class="dropdown ms-auto" style={{ "margin-left": "auto" }}>
      <button
        class="btn btn-sm dropdown-toggle d-flex align-items-center"
        type="button"
        onClick={() => setOpen(!open())}
        aria-expanded={open()}
      >
        <i class="bi bi-github fs-5" />
        <span class="ms-2">GitHub</span>
      </button>
      <div
        class={`dropdown-menu dropdown-menu-end p-3${open() ? " show" : ""}`}
        style={{ "min-width": "235px", left: "auto", right: 0 }}
      >
        <GitHubAuthPanel
          token={token()}
          user={user()}
          onTokenSet={setToken}
          onLogout={logout}
        />
      </div>
    </div>
  );
};
