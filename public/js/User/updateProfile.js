document.addEventListener('DOMContentLoaded', () => {

    // Highlighted: NEW HELPER FUNCTION TO DISPLAY MESSAGES
    function displayMessage(message, type, containerElement) {
        if (containerElement) {
            // Clear previous messages
            containerElement.innerHTML = ''; 
            
            let messageDiv = document.createElement('div');
            messageDiv.classList.add('alert', `alert-${type}`);
            messageDiv.textContent = message;
            messageDiv.style.display = 'block'; // Ensure it's visible

            containerElement.appendChild(messageDiv);

            // Optionally, hide after a few seconds
            setTimeout(() => {
                messageDiv.style.display = 'none';
                messageDiv.remove(); // Remove the element from the DOM
            }, 5000); // Message disappears after 5 seconds
        }
    }

    // Highlighted: GET REFERENCES TO THE SPECIFIC MESSAGE CONTAINERS
    const generalMessageContainer = document.getElementById('general-messages-container');
    const passwordMessageContainer = document.getElementById('password-messages-container');

    const profileForm = document.querySelector('form[action="/users/profile/updateProfile"]');
    const saveButton = document.getElementById('save-btn');

    // Highlighted: REMOVED THE OLD DYNAMIC messageDiv CREATION AND INSERTION LOGIC

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission

            // Highlighted: CLEAR PREVIOUS MESSAGES IN SPECIFIC CONTAINERS
            if (generalMessageContainer) generalMessageContainer.innerHTML = '';
            if (passwordMessageContainer) passwordMessageContainer.innerHTML = '';

            // Collect form data
            const username = document.getElementById('username').value.trim();
            const currentPassword = profileForm.querySelector('input[name="currentPassword"]').value;
            const newPassword = profileForm.querySelector('input[name="newPassword"]').value;
            const confirmPassword = profileForm.querySelector('input[name="confirmPassword"]').value;

            // Construct payload for the request
            const payload = {
                username: username,
                currentPassword: currentPassword,
                newPassword: newPassword,
                confirmPassword: confirmPassword
            };

            try {
                // Disable button to prevent multiple submissions
                if (saveButton) saveButton.disabled = true;

                const response = await fetch('/users/profile/updateProfile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.ok) { // This handles 200 OK
                    // Highlighted: CONDITIONAL DISPLAY OF SUCCESS MESSAGES
                    if (currentPassword || newPassword || confirmPassword) { // If user tried to change password
                        displayMessage(data.message, 'success', passwordMessageContainer);
                    } else {
                        displayMessage(data.message, 'success', generalMessageContainer);
                    }

                    // --- ADD THIS SECTION TO UPDATE THE HEADER USERNAME ---
                    const headerUsernameDisplay = document.getElementById('username-display'); // Assuming an ID for your header username
                    if (headerUsernameDisplay && data.updatedUser && data.updatedUser.username) {
                        headerUsernameDisplay.textContent = data.updatedUser.username;
                    }

                    if (currentPassword || newPassword || confirmPassword) { // If user tried to change password
                        profileForm.querySelector('input[name="currentPassword"]').value = '';
                        profileForm.querySelector('input[name="newPassword"]').value = '';
                        profileForm.querySelector('input[name="confirmPassword"]').value = '';
                    }

                } else { // This handles 4xx or 5xx errors
                    // Highlighted: CONDITIONAL DISPLAY OF ERROR MESSAGES
                    const errorMessage = data.message || 'An unknown error occurred.';
                    if (errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('current password')) {
                        displayMessage(errorMessage, 'danger', passwordMessageContainer);
                    } else {
                        displayMessage(errorMessage, 'danger', generalMessageContainer);
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                // Highlighted: CATCH BLOCK USES GENERAL MESSAGE CONTAINER
                displayMessage('Network error or server unreachable. Please try again.', 'danger', generalMessageContainer);
            } finally {
                if (saveButton) saveButton.disabled = false;
                // Highlighted: NO NEED TO MANIPULATE messageDiv.style.display HERE ANYMORE
            }
        });
    }
});

document.getElementById("profile-pic-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const form = new FormData(this);

    try {
        const response = await fetch("/users/upload-profile-picture", {
            method: "POST",
            body: form
        });

        const result = await response.json();
        if (result.success) {
            alert("Profile picture updated!");
            location.reload(); // or update image src with result.profilePicture
        } else {
            alert("Upload failed: " + result.message);
        }
    } catch (err) {
        console.error(err);
        alert("An error occurred during upload.");
    }
});

// Account Deletion Logic
const deleteAccountForm = document.getElementById('delete-account-form');

if (deleteAccountForm) {
    deleteAccountForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission

        const passwordInput = document.getElementById('passwordToDelete');
        const passwordToDelete = passwordInput ? passwordInput.value : '';

        const isLocalUser = !passwordInput.readOnly;

        // If it's a local user and no password was entered
        if (isLocalUser && !passwordToDelete) {
            alert('Please enter your password to confirm account deletion.');
            return;
        }

        try {
            const response = await fetch('/users/delete-account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ passwordToDelete: passwordToDelete })
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message || 'Account deleted successfully! Redirecting to login page.');
                window.location.href = '/';
            } else {
                alert('Account deletion failed: ' + (result.message || 'An unknown error occurred.'));
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('An error occurred during account deletion. Please try again.');
        }
    });
}