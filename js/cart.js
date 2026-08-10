function addToCart(productId) {
    // 🔴 Pehle check karein ki user logged-in hai ya nahi
    const token = localStorage.getItem("token"); // (Aapke login token ki key)
    if (!token) {
        alert("Pehle login karein product add karne ke liye!");
        window.location.href = "login.html"; // Login page par bhej dega
        return;
    }

    // Current Product find karein
    const product = allProducts.find(p => p._id === productId);
    if (!product) return;

    // Check if out of stock
    if (product.outOfStock || product.stock === 0) {
        alert("Sorry, yeh product out of stock hai!");
        return;
    }

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find(item => item._id === productId);

    const currentQtyInCart = existingItem ? existingItem.qty : 0;

    // 🔴 Stock Quantity Limit Check
    if (currentQtyInCart + 1 > product.stock) {
        alert(`Sorry! Is product ke sirf ${product.stock} units available hain.`);
        return;
    }

    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert("🛒 Product added to Cart!");
    updateCartCount();
}