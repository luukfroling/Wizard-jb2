/* @refresh reload */
import { render } from "solid-js/web";
import "./index.css";
import App from "./App";
import { getRepositoryLink, getCurrentFileHref } from "./lib/github";
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
  console.info("Database initialised.");
} else {
  console.warn("Database not initialised - no github repo link found.");
}

render(() => <App />, root!);
