// Load Sidebar
fetch("components/sidebar.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("sidebar-placeholder").innerHTML = data;
  });

// Load Header + Populate User Info
fetch("components/header.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("header-placeholder").innerHTML = data;

    // Now update username and email after header is inserted
    const userEmail = localStorage.getItem("userEmail");
    const userName = localStorage.getItem("userName");

    if (userEmail) {
      document.getElementById("user-email").textContent = userEmail;
    }

    if (userName) {
      document.getElementById("username").textContent = userName;
    }
  });

fetch("components/footer.html")
   .then(response => response.text())
   .then(data => {
     document.getElementById("footer-placeholder").innerHTML = data;
   });
