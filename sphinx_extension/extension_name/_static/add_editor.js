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

    // Add the script and style tag of the Vite app here
    const head = document.head;

    // Create the new section element
    // Main wrapper of the Sphinx Book is a section so might as well use that instead of div
    const editorSection = document.createElement('section');
    editorSection.id = 'extension_name_editor';

    // Get the relative path to the Vite app
    const htmlFilePath = '_static/dist/index.html';
    // const htmlFilePath2 = '././_static/dist/index.html'

    // Try to fetch the Vite app
    // Fix this for all paths...
    fetch(htmlFilePath).then(response => {
        if (!response.ok) {
            throw new Error(`extension_name: Response 2 was not ok: ${response.statusText}`);
        } else {
            return response.text();
        }
        // If OK, pass the response
    }).then(htmlContent => {
        // We want to extract the body and script tags
        const parser = new DOMParser();
        // User parser to get usable html app
        const viteApp = parser.parseFromString(htmlContent, "text/html");


        // Get the script tag form the Vite app
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

        // 2. Get the <style> tag from viteApp's head and add it to the current document's <head>
        const styleTagFromVite = viteApp.head.querySelector('style');
        if (styleTagFromVite) {
            // For <style> tags, importNode is generally fine.
            const newStyleTag = document.importNode(styleTagFromVite, true); // true for deep copy
            head.appendChild(newStyleTag);
            console.log("Style tag added to document <head>.");
        } else {
            console.warn("Style tag not found in the parsed HTML's head.");
        }

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
