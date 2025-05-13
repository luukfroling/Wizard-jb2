
// This function will be called to add the button
function addTeachBooksEditButton() {
    // Find the container where launch buttons are located.
    const navbarContainer = document.querySelector('.article-header-buttons');

    if (navbarContainer) {
        // Create the new container
        const actualContainer = document.createElement('div')
        actualContainer.classList.add('dropdown', 'dropdown-edit-buttons')

        // Create the actual button
        const editButton = document.createElement('button');
        editButton.id = 'teachbooks-edit-button';
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

        // Add the container to the navbar
        navbarContainer.prepend(actualContainer)

        // Add the button to the container.
        actualContainer.appendChild(editButton);

        // As in the basic theme a dropdown menu:
        // Maybe change this to pure html and add it as a whole... this is a mess
        // Create a list for the different links
        const hiddenList = document.createElement('ul')
        hiddenList.classList.add('dropdown-menu')
        // Define the list items as 'li' html tags
        const hiddenListItem = document.createElement('li')
        // The list item is a button
        const hiddenButtonContainer = document.createElement('button')
        hiddenButtonContainer.classList.add('btn', 'btn-sm', 'btn-edit-page', 'dropdown-item')
        // In the button we have two spans: one for the icon and the other for the text
        // This is the icon container
        const hiddenIconContainer = document.createElement('span')
        hiddenIconContainer.classList.add('btn__icon-container')
        // The actual icon
        const actualHiddenIcon = document.createElement('i')
        actualHiddenIcon.classList.add('fas', 'fa-pen')
        // The text for the current list item
        const actualHiddenText = document.createElement('span')
        actualHiddenText.classList.add('btn__text-container')
        actualHiddenText.textContent = "Edit page"
        // Define more list items for more options?
        // I don't think we need more options

        // Initialise the list next to the actual navbar button
        actualContainer.appendChild(hiddenList)
        hiddenList.appendChild(hiddenListItem)
        hiddenListItem.appendChild(hiddenButtonContainer)
        hiddenButtonContainer.appendChild(hiddenIconContainer)
        hiddenIconContainer.appendChild(actualHiddenIcon)
        hiddenButtonContainer.appendChild(actualHiddenText)

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
