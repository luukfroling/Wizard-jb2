import { Show, type Setter } from "solid-js";
import { GitHubTokenInput } from "./GitHubTokenInput";
import { GitHubUserPanel } from "./GitHubUserPanel";
import type { GitHubUser } from "../../lib/github/GitHubLogin";

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
          />
        )}
      </Show>
    </div>
  );
};
