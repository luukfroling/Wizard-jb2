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
 * Only add the extensions button when we have found the right format.
 */
function initializeExtension() {
    console.log("extension_name: Version 0.0.6 loaded in :)")
    if (checkTheme()) {
        // Add the button to the navbar
        addTeachBooksEditButton()
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
