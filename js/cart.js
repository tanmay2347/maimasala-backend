function addToCart(productId) {
    // 🔴 Pehle check karein ki user logged-in hai ya nahi
    const token = localStorage.getItem("token"); // (Aapke login token ki key)
    if (!token) {
        showToast("🔒 Pehle login karein!", "error");
        window.location.href = "login.html"; // Login page par bhej dega
        return;
    }

    // Current Product find karein
    const product = allProducts.find(p => p._id === productId);
    if (!product) return;

    // Check if out of stock
    if (product.outOfStock || product.stock === 0) {
        showToast("Sorry, yeh product out of stock hai!", "error");
        return;
    }

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find(item => item._id === productId);

    const currentQtyInCart = existingItem ? existingItem.qty : 0;

    // 🔴 Stock Quantity Limit Check
    if (currentQtyInCart + 1 > product.stock) {
        showToast(`Sorry! Is product ke sirf ${product.stock} units available hain.`, "error");
        return;
    }

    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    showToast("🛒 Product added to Cart!", "success");
    updateCartCount();
}

// Advanced Toast Notification Function (Alert ki jagah)
function showToast(message, type = "success") {
    // Purana toast agar ho toh hata dein
    const existingToast = document.getElementById("custom-toast");
    if (existingToast) existingToast.remove();

    // Naya toast element banayein
    const toast = document.createElement("div");
    toast.id = "custom-toast";
    toast.innerText = message;

    // Styling
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

    // 3 second baad apne aap gayab ho jayega
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}