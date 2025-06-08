/* @refresh reload */
import { render } from "solid-js/web";
import "./index.css";
import App from "./App";
import { getRepositoryLink, getCurrentFileHref } from "./lib/github";
import { database } from "./lib/localStorage/database";
import { showModal } from "./components/popups/popup_modal";
import { showToast } from "./components/popups/popup_toast";

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

let n = 0;

render(
  () => (
    <div>
      <button
        onClick={() =>
          showModal(
            <div>
              <h2>My Modal</h2>
              <p>Cool content here</p>
            </div>,
          )
        }
      >
        Open Modal
      </button>
      <button
        onClick={() =>
          showToast("Toast " + n++)
        }
      >
        Show Toast
      </button>

      <App />
      
    </div>
  ),
  root!,
);