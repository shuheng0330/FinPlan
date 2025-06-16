document.getElementById("login-btn").addEventListener("click", async function () {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Basic validation
    if (!email || !password) {
        window.toast.warning('Please enter both email and password.');
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
            window.toast.success('Login successful!');
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 1500); // 3 seconds delay
        } else {
            window.toast.error('Login failed: ' + data.message);
        }
    } catch (error) {
        console.error("Login error:", error);
        window.toast.error('An error occurred. Please try again later.');
    }
});
