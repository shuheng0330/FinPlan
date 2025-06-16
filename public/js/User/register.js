document.getElementById("register-btn").addEventListener("click", async function () {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    // Simple validation
    if (!name || !email || !password || !confirmPassword) {
        window.toast.warning("Please fill in all fields.");
        return;
    }

    if (password !== confirmPassword) {
        window.toast.warning("Passwords do not match.");
        return;
    }

    try {
        const response = await fetch("/users/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: name,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            window.toast.success("Registration successful!");
            setTimeout(() => {
                window.location.href = "/";
            }, 1500);
        } else {
            window.toast.error("Registration failed: " + data.message);
        }

    } catch (error) {
        console.error("Registration error:", error);
        window.toast.error("An error occurred. Please try again later.");
    }
});
