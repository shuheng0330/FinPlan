document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.querySelector('form[action="/users/profile/updateProfile"]');
    const saveButton = document.getElementById('save-btn'); // Assuming you add an ID to your submit button

    // This div will be used to display messages dynamically
    let messageDiv = document.createElement('div');
    messageDiv.classList.add('alert'); // Bootstrap alert class
    messageDiv.style.display = 'none'; // Initially hidden
    // Insert it before the form or within the card-body for better visibility
    if (profileForm) {
        profileForm.parentNode.insertBefore(messageDiv, profileForm);
    }


    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission

            // Clear previous messages
            messageDiv.style.display = 'none';
            messageDiv.textContent = '';
            messageDiv.classList.remove('alert-success', 'alert-danger');

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

                if (response.ok) {
                    messageDiv.textContent = data.message;
                    messageDiv.classList.add('alert-success');
                    // Optionally clear password fields on successful password change
                    profileForm.querySelector('input[name="currentPassword"]').value = '';
                    profileForm.querySelector('input[name="newPassword"]').value = '';
                    profileForm.querySelector('input[name="confirmPassword"]').value = '';
                } else {
                    messageDiv.textContent = data.message || 'An unknown error occurred.';
                    messageDiv.classList.add('alert-danger');
                }
            } catch (error) {
                console.error('Error:', error);
                messageDiv.textContent = 'Network error or server unreachable. Please try again.';
                messageDiv.classList.add('alert-danger');
            } finally {
                // Always re-enable the button
                if (saveButton) saveButton.disabled = false;
                messageDiv.style.display = 'block'; // Show the message
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
