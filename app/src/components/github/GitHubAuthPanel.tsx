import { Show } from "solid-js";
import { GitHubTokenInput } from "./GitHubTokenInput";
import { GitHubUserPanel } from "./GitHubUserPanel";
import type { GitHubUser } from "../../lib/github/GithubLogin";
import { github } from "../../lib/github/githubInteraction";

type Props = {
  token: string | null;
  user: GitHubUser | null;
  onLogout: () => void;
};

async function validateAndSetToken(token: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    github.setAuth(token);
    const repoInfo = github.fetchRepoInfo(); // load default branch
    github.setBranch((await repoInfo).default_branch); // set as curent branch TODO load from database
    return true;
  } catch {
    return false;
  }
}

export const GitHubAuthPanel = (props: Props) => {
  return (
    <div class="p-6" style={{ "max-width": "235px", width: "100%" }}>
      <Show when={!props.token}>
        <GitHubTokenInput onTokenSet={(token) => validateAndSetToken(token)} />
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
