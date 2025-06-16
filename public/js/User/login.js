document.getElementById("login-btn").addEventListener("click", async function () {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Basic validation
    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Login successful!");
            // Redirect user to dashboard or home page
            window.location.href = "/dashboard";
        } else {
            alert("Login failed: " + data.message);
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred. Please try again later.");
    }
});
