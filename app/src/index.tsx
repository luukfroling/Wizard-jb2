/* @refresh reload */
import { Suspense } from "solid-js";
import { render } from "solid-js/web";

import "./index.css";
import App from "./App";
import {
  getRepositoryLink,
  getCurrentFileHref,
  getFilePathFromHref,
  parseOwnerRepoFromHref,
} from "./lib/github/GithubUtility";
import { database } from "./lib/localStorage/database";
import { github } from "./lib/github/githubInteraction";

const root = document.getElementById("root");

if (!(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

//initialise github info
const ref = getRepositoryLink();
getCurrentFileHref();

if (ref != null) {
  const ownerRepo = parseOwnerRepoFromHref(ref);
  if (ownerRepo != undefined) {
    github.setRepo(ownerRepo?.repo);
    github.setOwner(ownerRepo?.owner);
  } else {
    console.warn("Database not initialised - failed to parse href.");
  }
} else {
  console.warn("Database not initialised - no github repo link found.");
}

window.addEventListener("beforeunload", async () => {
  // Get the file path
  const fileHref = getCurrentFileHref();
  const filePath = getFilePathFromHref(fileHref);

  // Get the editor content
  const content = window.__getEditorMarkdown
    ? window.__getEditorMarkdown()
    : "";

  // Save to the database if possible
  if (filePath && content && (await database.isInitialised())) {
    // Save as markdown
    database.save("markdown", filePath, content);
  }
});

render(
  () => (
    <Suspense>
      <App />
    </Suspense>
  ),
  root!,
);
