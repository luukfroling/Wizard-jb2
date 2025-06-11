/* @refresh reload */
import { render } from "solid-js/web";
import "./index.css";
import App from "./App";
import {
  getRepositoryLink,
  getCurrentFileHref,
  getFilePathFromHref,
} from "./lib/github/GitHubUtility";
import { database } from "./lib/localStorage/database";

const root = document.getElementById("root");

if (!(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

//initialise github info
const ref = getRepositoryLink();
getCurrentFileHref();

//initialise database
if (ref != null) {
  database.setActiveRepo(ref);
  database.setActiveBranch("localBranchName"); //TODO this needs to be selected by the user
  console.info("Database initialised.");
} else {
  console.warn("Database not initialised - no github repo link found.");
}

window.addEventListener("beforeunload", async () => {
  // Get the file path
  const fileHref = getCurrentFileHref();
  const filePath = getFilePathFromHref(fileHref);

  // Get the editor content
  const content = window.__getEditorContent ? window.__getEditorContent() : "";

  // Save to the database if possible
  if (filePath && content && (await database.isInitialised())) {
    // Save as markdown
    database.save("markdown", filePath, content);
  }
});

render(() => <App />, root!);
