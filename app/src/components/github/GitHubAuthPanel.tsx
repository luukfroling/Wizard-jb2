import { Show, type Setter, createSignal, onMount } from "solid-js";
import { GitHubTokenInput } from "./GitHubTokenInput";
import { GitHubUserPanel } from "./GitHubUserPanel";
import type { GitHubUser } from "../../lib/github";
import { useEditorView } from "../Editor";
import { getRepositoryLink, getDefaultBranchFromHref, repositoryHref } from "../../lib/github";

type Props = {
  token: string | null;
  user: GitHubUser | null;
  onTokenSet: Setter<string | null>;
  onLogout: () => void;
};

async function validateAndSetToken(
  token: string,
  setToken: Setter<string | null>,
): Promise<boolean> {
  // Try to fetch user info to validate the token
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    setToken(token);
    return true;
  } catch {
    return false;
  }
}

export const GitHubAuthPanel = (props: Props) => {
  const view = useEditorView();
  const getEditorContent = () => view?.()?.state.doc.textContent || "";

  const [baseBranch, setBaseBranch] = createSignal<string>("main");

  onMount(async () => {
    // Get the repository link (ensure it's set)
    const href = getRepositoryLink() ?? repositoryHref();
    if (href) {
      const branch = await getDefaultBranchFromHref(href, props.token ?? undefined);
      if (branch) setBaseBranch(branch);
    }
  });

  return (
    <div class="p-6">
      <Show when={!props.token}>
        <GitHubTokenInput
          onTokenSet={(token) => validateAndSetToken(token, props.onTokenSet)}
        />
      </Show>
      <Show when={props.user} keyed>
        {(user) => (
          <GitHubUserPanel
            user={user}
            onLogout={props.onLogout}
            token={props.token ?? ""}
            baseBranch={baseBranch()}
            getEditorContent={getEditorContent}
          />
        )}
      </Show>
    </div>
  );
};
