
// This function will be called to add the button
function addTeachBooksEditButton() {
    // Find the container where launch buttons are located.
    const navbarContainer = document.querySelector('.article-header-buttons');

    if (navbarContainer) {
        // Create the new container
        // Maybe there is a cleaner way for this but for now it is fine...
        const actualContainer = document.createElement('div')
        actualContainer.classList.add('dropdown', 'dropdown-edit-buttons')

        const dropdownMenu = document.createElement('ul')
        dropdownMenu.classList.add('dropdown-menu')

        const linkForMenu = document.createElement('li')
        const actualLink = document.createElement('a')
        actualLink.classList.add('btn', 'btn-sm', 'btn-edit-button', 'dropdown-item')
        actualLink.setAttribute('data-bs-placement', 'left')
        actualLink.setAttribute('data-bs-toggle', 'tooltip')
        actualLink.textContent = "Edit this page"

        // Create the actual button
        const editButton = document.createElement('button');
        editButton.id = 'teachbooks-edit-button';
        // Use theme classes for styling
        editButton.classList.add('btn', 'dropdown-toggle');

        // Add an icon (using FontAwesome, assuming it's available via the theme)
        const icon = document.createElement('i');
        icon.classList.add('fas', 'fa-edit'); // Other icons are possible
        editButton.appendChild(icon);

        // Logic for what happens when the edit button is clicked
        editButton.onclick = function() {
            console.log('TeachBooks Edit button clicked!');
            alert('Edit functionality to be implemented!');
        };


        //Create the list
        linkForMenu.appendChild(actualLink)
        dropdownMenu.appendChild(linkForMenu)

        // Add the button to the container.
        actualContainer.appendChild(editButton);
        actualContainer.appendChild(dropdownMenu)

        // Add the container to the navbar
        navbarContainer.prepend(actualContainer)



    } else {
        console.warn('TeachBooks: Header container for edit button not found.');
    }
}

// Wait for the DOM to be fully loaded before trying to add the button
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addTeachBooksEditButton);
} else {
    // DOMContentLoaded has already fired
    addTeachBooksEditButton();
}
