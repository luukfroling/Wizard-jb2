/**
 * Checks if the theme format is still the same.
 *
 * @returns {boolean} true if the format is correct.
 */
function checkTheme() {
    // Navigation container -> add button here
    const navbarContainer = document.querySelector('.article-header-buttons');
    // General article container -> add editor here
    const articleContainer = document.querySelector('.bd-article');

    // If one of these is missing we do not 'load' the extension
    if (!navbarContainer || !articleContainer || articleContainer.tagName !== 'ARTICLE') {
        console.log("extension_name: Either the navbar or the article container is missing. Stopping plugin");
        return false;
    }
    // Found both, we 'load' the extension
    return true;
}

/**
 * Modified from GitHubUtility.ts to check if a file is actually markdown
 * If it is not we cannot edit it.
 *
 * In the future we can also check if the file is hosted on GitHub or somewhere else.
 *
 * @returns {boolean} true if the file is markdown
 */
function checkMarkdown(){
    // The link to the GitHub repo
    const anchor = document.querySelector("a.btn-source-edit-button");
    if (anchor) {
        // If the link exists get the last two characters
        // If they match md (is markdown) true else false
        return anchor.href.slice(-2) === 'md';
    } else {
        // If the link doesn't exist, return false
        return false;
    }
}


/**
 * Only add the extensions button when we have found the right format.
 */
function initializeExtension() {
    // Check the theme and file extension
    if (checkTheme() && checkMarkdown()) {
        // Add the button to the navbar
        // Make sure to match this with myproject.toml and __init__.py
        console.log("extension_name: Version 0.1.3 loaded in :)");
        addTeachBooksEditButton()
    } else {
        // If one fails give a warning and do not load the editor
        console.warn("extension_name: Could not load the editor... Maybe the theme changed or the file is not supported.")
    }
}

/**
 * When the DOM finished loading we try to add our extension
 */
if (document.readyState === 'loading') {
    // Wait for loading to finish
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    // Already finished
    initializeExtension()
}
