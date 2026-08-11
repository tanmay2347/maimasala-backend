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

// 🌟 TOAST NOTIFICATION FUNCTION (Alert ki jagah)
function showToast(message, type = "success") {
    const existingToast = document.getElementById("custom-toast");
    if (existingToast) existingToast.remove();

    const toast = document.createElement("div");
    toast.id = "custom-toast";
    toast.innerText = message;
    
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.backgroundColor = type === "success" ? "#28a745" : "#dc3545";
    toast.style.color = "#fff";
    toast.style.padding = "12px 20px";
    toast.style.borderRadius = "8px";
    toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    toast.style.zIndex = "10000";
    toast.style.fontFamily = "sans-serif";
    toast.style.fontSize = "14px";
    toast.style.transition = "opacity 0.3s ease";

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
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
        showToast("🌶️ Welcome back, " + storedUser.name + "!", "success");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000);
    } else if (email === "admin@maimasala.com" && password === "admin123") {
        // Admin Master Login
        const adminUser = { name: "Admin", email: email, _id: "admin123", role: "admin" };
        localStorage.setItem("user", JSON.stringify(adminUser));
        showToast("Welcome Admin!", "success");
        setTimeout(() => {
            window.location.href = "admin.html";
        }, 1000);
    } else {
        showToast("❌ Invalid email or password!", "error");
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

    showToast("🎉 Registration Successful! Welcome to MaiMasala.", "success");
    setTimeout(() => {
        window.location.href = "index.html";
    }, 1000);
});