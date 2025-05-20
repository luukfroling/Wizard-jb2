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

    // Create the new section element
    // Main wrapper of the Sphinx Book is a section so might as well use that instead of div
    const editorSection = document.createElement('section');
    editorSection.id = 'extension_name_editor';

    // Get the relative path to the Vite app
    const htmlFilePath = './_static/dist/index.html';

    // Try to fetch the Vite app
    fetch(htmlFilePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`extension_name: Response was not ok: ${response.statusText}`);
            }
            // If OK, pass the response
            return response.text();
        })
        .then(htmlContent => {
            // We want to extract the body and script tags
            const parser = new DOMParser();
            // User parser to get usable html app
            const viteApp = parser.parseFromString(htmlContent, "text/html");

            // Extract all the children of the app and at to the editor
            while (viteApp.body.firstChild) {
                editorSection.appendChild(viteApp.body.firstChild)
            }
            // When extracted all the children add the editor to the article
            articleContainer.appendChild(editorSection);

            // We want to re-add all the scripts, so we're sure they can actually run
            const scriptsToExecute = [];
            viteApp.querySelectorAll('script').forEach(oldScript => {
                const newScript = document.createElement('script');
                // For each old script in the Vite app copy the attributes to the new script
                Array.from(oldScript.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                // If the old script had content, also copy that
                if (oldScript.textContent) {
                    newScript.textContent = oldScript.textContent;
                }

                // Add the new script to the list
                newScript.setAttribute('extension-name-editor-script', 'true');
                scriptsToExecute.push(newScript);
            });

            // Append scripts to the editor section
            scriptsToExecute.forEach(script => {
                editorSection.appendChild(script);
            });
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
