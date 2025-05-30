import { createSignal } from "solid-js";

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

  return (
    <div class="flex flex-col items-center justify-center w-full">
      <h2 class="text-lg font-bold mb-2">Enter GitHub Access Token</h2>
      <input
        class="border p-2 w-full max-w-md mb-2"
        type="password"
        placeholder="Paste fine grained PAT here"
        value={token()}
        onInput={(e) => setToken(e.currentTarget.value)}
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
        <a
          href="localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-600 underline text-sm"
        >
          How to create an access token?
        </a>
      </div>
    </div>
  );
};
