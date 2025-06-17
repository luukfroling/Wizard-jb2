/* @refresh reload */
import { Suspense } from "solid-js";
import { render } from "solid-js/web";

import "./index.css";
import App from "./App";
import {
  getRepositoryLink,
  getCurrentFileHref,
  parseOwnerRepoFromHref,
} from "./lib/github/GithubUtility";
import { github } from "./lib/github/githubInteraction";
import { saveEditorContentToDatabase } from "./components/Editor";

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
    github.setRepo(ownerRepo.repo);
    github.setOwner(ownerRepo.owner);
  } else {
    console.warn("Database not initialised - failed to parse href.");
    github.setRepo("repo");
    github.setBranch("branch");
    github.setOwner("owner");
  }
} else {
  console.warn("Database not initialised - no github repo link found.");
  github.setRepo("repo");
  github.setBranch("branch");
  github.setOwner("owner");
}

window.addEventListener("beforeunload", async () => {
  await saveEditorContentToDatabase();
});

render(
  () => (
    <Suspense>
      <App />
    </Suspense>
  ),
  root!,
);
