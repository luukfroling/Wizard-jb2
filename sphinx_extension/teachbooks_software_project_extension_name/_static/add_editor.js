/**
 * Fetch the Vite app (editor) from the GitHub repo
 *
 * @param baseURL               The url of the current file
 * @param depth                 How far do we go bag for the editor
 * @return {Promise<string>}    If found return the response in text form
 */
async function fetchViteApp(baseURL, depth) {
    // Error for later use
    let error;
    // Loop until the editor is found or depth is reached
    for (let i = 0; i <= depth; i++) {
        // First prefix is nothing
        let prefix = '';
        // Add '../' (go one folder up) until we reach the current depth
        if (i > 0) {
            prefix = Array(i).fill('../').join('');
        }
        // Create the full URL
        const currentPath = prefix + baseURL;
        const fullUrl = new URL(currentPath, document.baseURI).href;

        // Log what is happening
        console.log(`extension_name: Attempting (depth ${i}): ${fullUrl}`);

        // Actual fetching: try to get file, if not found warn the user and try new depth
        try {
            // Try to get editor
            const response = await fetch(currentPath);

            // If found return the response in text form
            // Else try again
            if (response.ok) {
                console.log(`extension_name: Successfully fetched from: ${response.url}`);
                return await response.text(); // Success!
            } else {
                // Store the error status for this attempt if it's a client/server error
                if (response.status >= 400) {
                    error = new Error(`extension_name: HTTP error ${response.status} for ${response.url}`);
                }
                // If not ok (e.g., 404), continue to the next depth
            }
        } catch (networkError) {
            // Network errors (e.g., DNS, CORS, server down)
            console.warn(`extension_name: Network error for ${fullUrl}:`, networkError);
            error = networkError; // Store the network error
            // Continue to the next depth or if it's the last attempt, this error will be thrown
        }
    }

    // If the loop completes without returning, all attempts failed.so throw error
    const errorMessage = `Failed to fetch Vite app from "${baseURL}" within ${depth} parent director(y/ies).`;
    console.error(errorMessage, error || "No specific response error, check network logs.");
    if (error) {
        error.message = `extension_name: ${errorMessage} Last error: ${error.message}`;
        throw error;
    }
    throw new Error(errorMessage);
}

/**
 * Function for adding the actual editor
 */
function addViteApp() {
    // Check if the editor is already there
    if (document.getElementById('extension_name_editor')) {
        // If the editor is there, we do not need to add it again.
        console.log("extension_name: Pressed it twice? Dr Wong");
        return;
    }

    // We know this exists... Maybe let checkTheme() pass this.
    const articleContainer = document.querySelector('.bd-article');

    // Remove all the sections within the articleContainer: old content
    const sections = articleContainer.querySelectorAll('section');
    sections.forEach(section => {
        section.remove();
      });

    // Add the script and style tag of the Vite app here
    const head = document.head;

    // Create the new section element
    // Main wrapper of the Sphinx Book is a section so might as well use that instead of div
    const editorSection = document.createElement('section');
    editorSection.id = 'extension_name_editor';

    // Get the relative path to the Vite app
    const htmlFilePath = '_static/dist/index.html';

    // Fetch the Vite app
    fetchViteApp(htmlFilePath, 5).then(htmlContent => {
        // We want to extract the body and script tags
        const parser = new DOMParser();
        // User parser to get usable html app
        const viteApp = parser.parseFromString(htmlContent, "text/html");

        // 1. Get the <style> tag from viteApp's head and add it to the current document's <head>
        const styleTagFromVite = viteApp.head.querySelector('style');
        if (styleTagFromVite) {
            // For <style> tags, importNode is generally fine.
            const newStyleTag = document.importNode(styleTagFromVite, true); // true for deep copy
            head.appendChild(newStyleTag);
            console.log("Style tag added to document <head>.");
        } else {
            console.warn("Style tag not found in the parsed HTML's head.");
        }

        // 2. Add the root tag to the document body
        const rootDivFromVite = viteApp.body.querySelector('#root'); // Or viteApp.getElementById('root')
        if (rootDivFromVite) {
            // For regular HTML elements, importNode is the standard way.
            const newRootDiv = document.importNode(rootDivFromVite, true); // true for deep copy
            editorSection.appendChild(newRootDiv);
            articleContainer.appendChild(editorSection);
            console.log("Div #root added to .bd-article.");
        } else {
            console.warn("Div with id 'root' not found in the parsed HTML's body.");
        }

        // 3. Get the script tag form the Vite app
        const scriptTagFromVite = viteApp.head.querySelector('script');
        if (scriptTagFromVite) {
            // IMPORTANT: For inline scripts to execute reliably when moved between documents
            // or dynamically added, it's best to create a new script element
            // in the target document and copy its content and attributes.
            const newScript = document.createElement('script');

            // Copy attributes (e.g., type, id) from the original script
            for (let i = 0; i < scriptTagFromVite.attributes.length; i++) {
                const attr = scriptTagFromVite.attributes[i];
                newScript.setAttribute(attr.name, attr.value);
            }

            // Copy the content (the actual JavaScript code)
            newScript.textContent = scriptTagFromVite.textContent;

            // Append the new script tag to the current document's head
            head.appendChild(newScript);
            console.log("Script tag added to document <head>.");
        } else {
            console.warn("extension_name: Script tag not found in the parsed HTML's head.");
        }
    })
    // If something went wrong
    .catch(error => {
        console.error('extension-name: Error fetching or embedding Vite app:', error);
        editorSection.innerHTML = '<p style="color:red;">Error loading editor content. See console for details.</p>';
        // Append the section to show the error message
        if (!document.getElementById('extension_name_editor')) {
             articleContainer.appendChild(editorSection);
        }
    });
}
