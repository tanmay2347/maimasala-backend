// Tab Switching Logic
function switchTab(tab) {
    const loginTab = document.getElementById("loginTab");
    const signupTab = document.getElementById("signupTab");
    const indicator = document.getElementById("tabIndicator");
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    if (tab === "login") {
        loginTab.classList.add("active");
        signupTab.classList.remove("active");
        indicator.style.transform = "translateX(0%)";
        
        signupForm.classList.remove("active");
        setTimeout(() => {
            loginForm.classList.add("active");
        }, 150);
    } else {
        signupTab.classList.add("active");
        loginTab.classList.remove("active");
        indicator.style.transform = "translateX(100%)";
        
        loginForm.classList.remove("active");
        setTimeout(() => {
            signupForm.classList.add("active");
        }, 150);
    }
}

// LOGIN SUBMIT HANDLER
document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    // Local Storage Mock User Check
    const storedUser = JSON.parse(localStorage.getItem("registeredUser"));

    if (storedUser && storedUser.email === email && storedUser.password === password) {
        localStorage.setItem("user", JSON.stringify(storedUser));
        alert("🌶️ Welcome back, " + storedUser.name + "!");
        window.location.href = "index.html";
    } else if (email === "admin@maimasala.com" && password === "admin123") {
        // Admin Master Login
        const adminUser = { name: "Admin", email: email, _id: "admin123", role: "admin" };
        localStorage.setItem("user", JSON.stringify(adminUser));
        alert("Welcome Admin!");
        window.location.href = "admin.html";
    } else {
        alert("❌ Invalid email or password!");
    }
});

// SIGNUP SUBMIT HANDLER
document.getElementById("signupForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    const newUser = {
        _id: "user_" + Date.now(),
        name: name,
        email: email,
        password: password
    };

    localStorage.setItem("registeredUser", JSON.stringify(newUser));
    localStorage.setItem("user", JSON.stringify(newUser));

    alert("🎉 Registration Successful! Welcome to MaiMasala.");
    window.location.href = "index.html";
});