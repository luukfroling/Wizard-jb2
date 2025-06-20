import { createSignal } from "solid-js";
import { showModal } from "../popups/popup_modal"; // <-- import showModal

type Props = {
  onTokenSet: (token: string) => Promise<boolean> | boolean;
};

export const GitHubTokenInput = (props: Props) => {
  const [token, setToken] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);

  const handleSave = async () => {
    if (token().trim()) {
      try {
        const result = await props.onTokenSet(token());
        if (result === false) {
          setError("The token was invalid. Please try again.");
        } else {
          setError(null);
        }
      } catch {
        setError("The token was invalid. Please try again.");
      }
    }
  };

  // Instructions for creating a fine-grained PAT
  const handleShowInstructions = () => {
    showModal(
      <div style={{ color: "#000" }}>
        <h2 style={{ color: "#000" }}>
          How to Create a GitHub Fine-Grained Personal Access Token
        </h2>
        <ol
          style={{ color: "#000", "text-align": "left", "margin-left": "1em" }}
        >
          <li>
            Click{" "}
            <a
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 underline text-sm"
            >
              here
            </a>{" "}
            to open the token creation menu.
          </li>
          <li>
            <b>Name</b> your token and set an <b>expiration</b> if desired.
          </li>
          <li>
            Under <b>Resource owner</b>, select <b>Your account</b>, if it was
            not already preselected.
          </li>
          <li>
            Under <b>Repository access</b>, choose <b>All repositories</b>.
          </li>
          <li>
            Under <b>Repository permissions</b>, set <b>Contents</b> to{" "}
            <b>Read and write</b>.
          </li>
          <li>
            Scroll down and click <b>Generate token</b>.
          </li>
          <li>
            <b>Copy</b> the token and paste it here.
          </li>
        </ol>
        <div style={{ "font-size": "0.95em", color: "#b91c1c" }}>
          <b>Note:</b> This token will not be visible again. If you want to use
          it more, save it somewhere.
        </div>
      </div>,
    );
  };

  return (
    <div class="flex flex-col items-center justify-center w-full">
      <h2 class="text-lg font-bold mb-2">Enter GitHub Access Token</h2>
      <input
        class="border p-2 w-full max-w-md mb-2"
        type="password"
        placeholder="Paste fine grained PAT here"
        value={token()}
        onInput={(e) => setToken(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSave();
          }
        }}
      />
      <div class="w-full flex justify-center">
        <button
          onClick={handleSave}
          class="bg-black text-white px-4 py-2 rounded w-full max-w-md"
        >
          Save Token
        </button>
      </div>
      {error() && (
        <div class="mt-2 text-left text-red-600 w-full max-w-md">{error()}</div>
      )}
      <div class="mt-2 text-left w-full max-w-md">
        <a
          href="https://github.com/settings/personal-access-tokens/new"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-600 underline text-sm"
        >
          Don't have an access token?
        </a>
      </div>
      <div class="mt-2 text-left w-full max-w-md">
        <span
          onClick={handleShowInstructions}
          class="text-blue-600 underline text-sm"
          style={{ "text-align": "left" }}
          role="button"
          tabindex={0}
        >
          How to create an access token?
        </span>
      </div>
    </div>
  );
};
