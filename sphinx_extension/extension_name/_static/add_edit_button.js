/**
 * Function for adding the button to the navbar.
 */
function addTeachBooksEditButton() {
    // Check if the button is there already
    if (document.getElementById('extension_name_button')) {
        // If the button is there, we do not need to add it again.
        console.log("extension_name: The navbar button is already there...");
        return;
    }

    // We know this exists... Maybe let checkTheme() pass this.
    const navbarContainer = document.querySelector('.article-header-buttons');

    // The HTML for the new menu item using the standard sphinx-book-theme
    // The classes are for the theme (styling)
    const navIconHTML = `
        <!-- The new navigation div -->
        <div class="dropdown" id="extension_name_button">
            <!-- The button with icon you see --> 
            <button id="extension_name-button_1" class="btn dropdown-toggle" onclick="addViteApp()">
                <i class="fas fa-edit"></i>
            </button>
            <!-- The menu that shows on hover -->
            <ul class="dropdown-menu">
                <li>
                    <!-- Icon and text in one button with the onclick value -->
                    <button id="extension_name-button_2" class="btn btn-sm btn-edit-page dropdown-item" onclick="addViteApp()">
                        <!-- First the icon, then the text -->
                        <span class="btn__icon-container"><i class="fas fa-pen"></i></span>
                        <span class="btn__text-container">Edit page</span>
                    </button>
                </li>                
            </ul>
        </div>
    `

    // Add the new menu item to the menu
    navbarContainer.insertAdjacentHTML('afterbegin', navIconHTML);
}
