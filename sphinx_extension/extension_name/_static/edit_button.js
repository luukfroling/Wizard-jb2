
// This function will be called to add the button
function addTeachBooksEditButton() {
    // Find the container where launch buttons are located.
    const navbarContainer = document.querySelector('.article-header-buttons');

    if (navbarContainer) {
        // The HTML for the new menu item using the standard sphinx-book-theme
        // The classes are for the theme (styling)
        const navIconHTML = `
            <!-- The new navigation div -->
            <div class="dropdown">
                <!-- The button with icon you see --> 
                <button id="extension_name-button_1" class="btn dropdown-toggle" onclick="extension_name()">
                    <i class="fas fa-edit"></i>
                </button>
                <!-- The menu that shows on hover -->
                <ul class="dropdown-menu">
                    <li>
                        <!-- Icon and text in one button with the onclick value -->
                        <button id="extension_name-button_2" class="btn btn-sm btn-edit-page dropdown-item" onclick="extension_name()">
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

    } else {
        console.warn('TeachBooks: Header container for edit button not found.');
    }
}

// Logic for what happens when the edit button is clicked
function extension_name() {
    console.log('TeachBooks Edit button clicked!');
    alert('Edit functionality to be implemented!');
}

// Wait for the DOM to be fully loaded before trying to add the button
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addTeachBooksEditButton);
} else {
    // DOMContentLoaded has already fired
    addTeachBooksEditButton();
}
