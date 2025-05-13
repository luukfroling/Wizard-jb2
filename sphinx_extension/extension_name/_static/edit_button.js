
// This function will be called to add the button
function addTeachBooksEditButton() {
    // Find the container where launch buttons are located.
    const headerEndContainer = document.querySelector('.article-header-buttons');

    if (headerEndContainer) {
        // TODO: Add the dropdown menu here

        // Create the actual button
        const editButton = document.createElement('button');
        editButton.id = 'teachbooks-edit-button';
        editButton.classList.add('btn'); // Use theme classes for styling

        // TODO: Change this to the dropdown menu defined above
        editButton.setAttribute('data-tippy-content', 'Edit this page'); // Tooltip

        // Add an icon (using FontAwesome, assuming it's available via the theme)
        const icon = document.createElement('i');
        icon.classList.add('fas', 'fa-edit'); // Other icons are possible
        editButton.appendChild(icon);

        // Logic for what happens when the edit button is clicked
        editButton.onclick = function() {
            console.log('TeachBooks Edit button clicked!');
            alert('Edit functionality to be implemented!');
        };


        // TODO: Not needed if we use the proper dropdown menu
        if (window.tippy) {
          window.tippy(editButton, {
            // You can add Tippy.js options here if needed
            // allowHTML: false,
            // placement: 'bottom',
            theme: 'dark',
          });
          console.log("Tippy initialized on TeachBooks Edit button.");
        } else {
          console.warn("Tippy.js (window.tippy) not found.");
        }

    // Add the button to the container.
    headerEndContainer.prepend(editButton);

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

