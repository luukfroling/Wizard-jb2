console.log("[wizard] Script loaded.");

let isEditorMode = false;
let iframeElement = null;
let originalContent = null;
let owner = "unknown";
let repo = "unknown";
let filePath = "not found";
let container = null;
let footerLinks = null;
let giscus = null;

// check if metadata is present (owner, repo, file)
const parseMetadata = function() {

    const repoAnchor = document.querySelector('a[title*="GitHub Repository:"]');
    const fileAnchor = document.querySelector('a[title="Edit This Page"]');

    if (!repoAnchor || !fileAnchor) {
        console.warn("[wizard] Could not find necessary metadata anchors.");
        console.log("[wizard] Repo Anchor Found:", !!repoAnchor);
        console.log("[wizard] File Anchor Found:", !!fileAnchor);
        return false;
    }

    // Parse Owner and Repo
    const repoMatch = repoAnchor.href.match(/github\.com\/([^/]+)\/([^/]+)/);
    
    if (repoMatch) {
        owner = repoMatch[1];
        repo = repoMatch[2];
    }

    // Parse File Path
    const fileUrlParts = fileAnchor.href.split('/edit/');
    if (fileUrlParts.length > 1) {
        // Skips branch name to get the path
        filePath = fileUrlParts[1].split('/').slice(1).join('/');
    }

    console.log(`[wizard] Parsed Metadata - Owner: ${owner}, Repo: ${repo}, File: ${filePath}`);
    return true;
};

const createToggleButton = function() {
    // Create a button styled similar to the theme toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'wizard-toggle-button rounded-full aspect-square border border-stone-700 dark:border-white hover:bg-neutral-100 border-solid overflow-hidden text-stone-700 dark:text-white hover:text-stone-500 dark:hover:text-neutral-800 w-10 h-10 mx-3';
    toggleButton.title = 'Toggle between editor and original view';
    toggleButton.setAttribute('aria-label', 'Toggle between editor and original view');
    
    // Add SVG icon (document/code icon)
    toggleButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" data-slot="icon" class="h-full w-full p-0.5">
            <path fill-rule="evenodd" d="M3 5.25a1.5 1.5 0 0 1 1.5-1.5h16.5a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5H4.5a1.5 1.5 0 0 1-1.5-1.5V5.25zm1.5.75a.75.75 0 0 0-.75.75v12c0 .414.336.75.75.75h16.5a.75.75 0 0 0 .75-.75V6.75a.75.75 0 0 0-.75-.75H4.5z" clip-rule="evenodd"></path>
            <path fill-rule="evenodd" d="M7.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0-1.5a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5z" clip-rule="evenodd"></path>
        </svg>
    `;
    
    toggleButton.addEventListener('click', toggleView);
    return toggleButton;
};

const hideOriginalContent = function() {
    container = document.querySelector('article') || document.body;
    
    // Store original content
    originalContent = container.innerHTML;
    
    // Identify elements to protect
    footerLinks = container.querySelector('.myst-footer-links');
    giscus = document.getElementById('giscus_container');

    // Clear container safely
    const children = Array.from(container.children);
    children.forEach(child => {
        if (child === footerLinks || child === giscus || (giscus && child.contains(giscus))) {
            return; 
        }
        container.removeChild(child);
    });
};

const showEditor = function() {
    if (isEditorMode) return;
    
    hideOriginalContent();
    
    // 3. Construct Iframe
    const iframeBase = 'https://luukfroling.github.io/Wizard-jb2/';
    const finalUrl = `${iframeBase}?owner=${owner}&repo=${repo}&file=${filePath}`;
    
    console.log("[wizard] Iframe URL:", finalUrl);

    iframeElement = document.createElement('iframe');
    iframeElement.src = finalUrl;
    iframeElement.style.width = "100%";
    iframeElement.style.height = "800px";
    iframeElement.style.border = "none";
    iframeElement.style.borderRadius = "8px";

    // Inject Iframe at the top
    container.prepend(iframeElement);
    window.scrollTo(0, 0);
    
    isEditorMode = true;
    console.log("[wizard] Editor view activated.");
};

const showOriginal = function() {
    if (!isEditorMode) return;
    
    container = document.querySelector('article') || document.body;
    
    // Remove iframe
    if (iframeElement && iframeElement.parentNode) {
        iframeElement.parentNode.removeChild(iframeElement);
    }
    
    // Restore original content
    if (originalContent) {
        container.innerHTML = originalContent;
    }
    
    isEditorMode = false;
    console.log("[wizard] Original view restored.");
};

const toggleView = function() {
    if (isEditorMode) {
        showOriginal();
    } else {
        showEditor();
    }
};

const addToggleButton = function() {
    // Find the navbar container
    const navbarContainer = document.querySelector('div.flex.items-center.flex-grow.w-auto');
    
    if (!navbarContainer) {
        console.warn("[wizard] Could not find navbar container.");
        return;
    }
    
    // Create and insert the toggle button before the theme button
    const themeButton = navbarContainer.querySelector('.myst-theme-button');
    const toggleButton = createToggleButton();
    
    if (themeButton) {
        themeButton.parentNode.insertBefore(toggleButton, themeButton);
    } else {
        navbarContainer.appendChild(toggleButton);
    }
    
    console.log("[wizard] Toggle button added to navbar.");
};

const initWizard = function() {

    // 
    if (!parseMetadata()) {
        return;
    }
    
    addToggleButton();
    showEditor();
};

// Always run the script
console.log("[wizard] Editor mode detected, initializing wizard...");
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(initWizard, 4000);
});
