// ================= CART COUNT UPDATE =================
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function updateCartCount() {
    const cartCount = document.getElementById("cartCount");
    if (cartCount) {
        cartCount.innerText = cart.length;
    }
}
updateCartCount();

let allFetchedProducts = [];

// ================= LOAD PRODUCTS WITH WEIGHT VARIANT SELECTOR =================
const productContainer = document.getElementById("productContainer");

if (productContainer) {
    fetch("https://maimasala-backend.onrender.com/api/products")
        .then(res => res.json())
        .then(products => {
            productContainer.innerHTML = "";
            allFetchedProducts = products;

            if (!products.length) {
                productContainer.innerHTML = "<p>No products available yet.</p>";
                return;
            }

            products.forEach(product => {
                // 🛠️ Image URL Clean-up (Special character/corruption fix)
                let rawImg = product.image ? product.image.replace(/\\/g, '/') : '';
                rawImg = rawImg.replace(/[^\x20-\x7E]/g, ''); // Invisible/corrupted characters hatane ke liye
                const imageUrl = rawImg ? `https://maimasala-backend.onrender.com/${rawImg}` : 'https://via.placeholder.com/200';

                const safeName = (product.name || '').replace(/'/g, "\\'");
                const safeDesc = (product.description || '').replace(/'/g, "\\'").replace(/\n/g, ' ');
                const safeUsage = (product.usage || '').replace(/'/g, "\\'").replace(/\n/g, ' ');
                const safeRecipe = (product.recipe || '').replace(/'/g, "\\'").replace(/\n/g, ' ');
                
                const isOutOfStock = product.outOfStock || (product.stock !== undefined && product.stock <= 0);
                const stockQty = product.stock !== undefined ? Number(product.stock) : 10;

                // 🟢 DYNAMIC WEIGHT VARIANTS DROPDOWN GENERATOR
                let variantOptionsHtml = '';
                let defaultPrice = product.price;

                if (product.variants && product.variants.length > 0) {
                    defaultPrice = product.variants[0].price;
                    product.variants.forEach((v, idx) => {
                        variantOptionsHtml += `<option value="${idx}" data-price="${v.price}">${v.weight} - ₹${v.price}</option>`;
                    });
                } else {
                    variantOptionsHtml = `
                        <option value="default" data-price="${product.price}">100g - ₹${product.price}</option>
                        <option value="250g" data-price="${Math.round(product.price * 2.3)}">250g - ₹${Math.round(product.price * 2.3)}</option>
                        <option value="500g" data-price="${Math.round(product.price * 4.2)}">500g - ₹${Math.round(product.price * 4.2)}</option>
                        <option value="1kg" data-price="${Math.round(product.price * 8)}">1kg - ₹${Math.round(product.price * 8)}</option>
                    `;
                }

                let stockText = '';
                let stockTag = '';

                if (isOutOfStock) {
                    stockTag = `<span class="stock-tag" style="background:#ff4d4d; color:white; padding:4px 8px; border-radius:4px; font-size:12px; position:absolute; top:10px; left:10px; font-weight:bold;">OUT OF STOCK</span>`;
                    stockText = `<p style="color: #d32f2f; font-weight: bold; font-size: 13px; margin: 5px 0;">🔴 Currently Unavailable</p>`;
                } else if (stockQty <= 5) {
                    stockTag = `<span class="stock-tag" style="background:#f57c00; color:white; padding:4px 8px; border-radius:4px; font-size:12px; position:absolute; top:10px; left:10px; font-weight:bold;">⚠️ Hurry! Only ${stockQty} Left</span>`;
                    stockText = `<p style="color: #d32f2f; font-weight: bold; font-size: 13px; margin: 5px 0;">⚠️ Only ${stockQty} Packets Left in Stock!</p>`;
                } else {
                    stockText = `<p style="color: #2e7d32; font-weight: bold; font-size: 13px; margin: 5px 0;">🟢 Available: ${stockQty} Packets</p>`;
                }

                productContainer.innerHTML += `
                    <div class="product-card" onclick="openProduct('${product._id}', '${safeName}', ${product.price}, '${imageUrl}', '${safeDesc}', ${isOutOfStock}, ${stockQty}, '${safeUsage}', '${safeRecipe}')" style="position: relative; cursor: pointer;">
                        
                        ${stockTag}

                        <img src="${imageUrl}" onerror="this.src='https://via.placeholder.com/200'">

                        <h3>${product.name}</h3>

                        <!-- ⚖️ WEIGHT SELECTOR DROPDOWN -->
                        <div style="margin: 10px 0;" onclick="event.stopPropagation();">
                            <label style="font-size:12px; font-weight:bold; color:#555;">Select Pack Size:</label>
                            <select id="weightSelect_${product._id}" onchange="changeVariantPrice('${product._id}')" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-weight: bold; margin-top: 4px;">
                                ${variantOptionsHtml}
                            </select>
                        </div>

                        ${stockText}

                        <p class="price" id="priceDisplay_${product._id}">
                            ₹${defaultPrice}
                        </p>

                        <div class="button-group">
                            ${isOutOfStock ? `
                                <button class="cart-btn" disabled style="background:gray; cursor:not-allowed; width:100%;">❌ Out Of Stock</button>
                            ` : `
                                <button class="cart-btn" onclick="event.stopPropagation(); addToCartVariant('${product._id}', '${safeName}', '${imageUrl}')">🛒 Add</button>
                                <button class="buy-btn" onclick="event.stopPropagation(); buyNowVariant('${product._id}', '${safeName}', '${imageUrl}')">⚡ Buy Now</button>
                            `}
                        </div>
                    </div>
                `;
            });
        })
        .catch(err => {
            console.error("Fetch Error:", err);
            productContainer.innerHTML = "<p>Error loading products. Check backend connection.</p>";
        });
}

// 🟢 LIVE PRICE CHANGE ACCORDING TO WEIGHT SELECTION
window.changeVariantPrice = function(productId) {
    const selectEl = document.getElementById(`weightSelect_${productId}`);
    const priceDisplay = document.getElementById(`priceDisplay_${productId}`);
    if (!selectEl || !priceDisplay) return;

    const selectedOption = selectEl.options[selectEl.selectedIndex];
    const newPrice = selectedOption.getAttribute("data-price");
    priceDisplay.innerText = `₹${newPrice}`;
};

// ================= SEARCH FUNCTIONALITY =================
const searchInput = document.getElementById("searchInput");
if (searchInput) {
    searchInput.addEventListener("keyup", function () {
        const value = this.value.toLowerCase();
        document.querySelectorAll(".product-card").forEach(card => {
            const name = card.querySelector("h3").innerText.toLowerCase();
            card.style.display = name.includes(value) ? "block" : "none";
        });
    });
}

// ================= OPEN PRODUCT DETAIL =================
window.openProduct = function(id, name, price, image, description, outOfStock, stock, usage, recipe) {
    let cleanImage = image ? image.replace(/[^\x20-\x7E]/g, '') : '';
    if (cleanImage.includes("localhost:5000//")) {
        cleanImage = cleanImage.replace("localhost:5000//", "localhost:5000/");
    }

    localStorage.setItem("productId", id);
    localStorage.setItem("productName", name);
    localStorage.setItem("productPrice", price);
    localStorage.setItem("productImage", cleanImage);
    localStorage.setItem("productDescription", description);
    localStorage.setItem("productOutOfStock", outOfStock ? "true" : "false");
    localStorage.setItem("productStockCount", stock || 0);
    localStorage.setItem("productUsage", usage || "Best for authentic Indian cooking.");
    localStorage.setItem("productRecipe", recipe || "Add while frying spices to release natural aroma.");
    
    window.location.href = "product.html";
};

// 🟢 ADD TO CART WITH SELECTED WEIGHT & PRICE
window.addToCartVariant = function(productId, name, image) {
    const selectEl = document.getElementById(`weightSelect_${productId}`);
    const selectedOption = selectEl ? selectEl.options[selectEl.selectedIndex] : null;

    const weightLabel = selectedOption ? selectedOption.text.split(" - ")[0] : "100g";
    const selectedPrice = selectedOption ? Number(selectedOption.getAttribute("data-price")) : 100;

    const itemFullName = `${name} (${weightLabel})`;

    let currentCart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingIndex = currentCart.findIndex(item => item.name === itemFullName);

    if (existingIndex > -1) {
        currentCart[existingIndex].qty = Number(currentCart[existingIndex].qty || 1) + 1;
    } else {
        currentCart.push({ 
            _id: productId,
            name: itemFullName, 
            price: selectedPrice, 
            image: image, 
            qty: 1 
        });
    }

    localStorage.setItem("cart", JSON.stringify(currentCart));
    cart = currentCart;
    updateCartCount();
    alert(`✅ ${itemFullName} added to cart!`);
};

// 🟢 BUY NOW WITH SELECTED WEIGHT
window.buyNowVariant = function(productId, name, image) {
    const selectEl = document.getElementById(`weightSelect_${productId}`);
    const selectedOption = selectEl ? selectEl.options[selectEl.selectedIndex] : null;

    const weightLabel = selectedOption ? selectedOption.text.split(" - ")[0] : "100g";
    const selectedPrice = selectedOption ? Number(selectedOption.getAttribute("data-price")) : 100;

    const itemFullName = `${name} (${weightLabel})`;

    localStorage.setItem("buyNow", JSON.stringify({ 
        _id: productId, 
        name: itemFullName, 
        price: selectedPrice, 
        image: image, 
        qty: 1 
    }));
    window.location.href = "checkout.html";
};

// ================= MENU TOGGLE =================
window.toggleMenu = function() {
    const menu = document.getElementById("mobileMenu");
    const overlay = document.getElementById("menuOverlay");
    
    if (menu && overlay) {
        menu.classList.toggle("active");
        overlay.classList.toggle("active");
    }
};

// ================= DYNAMIC AUTH LOGIC =================
function checkUserLogin() {
    const menuAuthSection = document.getElementById("menuAuthSection");
    const authSection = document.getElementById("authSection");
    const adminMenuLink = document.getElementById("adminMenuLink");

    const currentUser = JSON.parse(localStorage.getItem("user"));

    if (adminMenuLink) {
        if (currentUser && currentUser.role === "admin") {
            adminMenuLink.style.display = "block";
        } else {
            adminMenuLink.style.display = "none";
        }
    }

    if (menuAuthSection) {
        if (currentUser && currentUser.name) {
            menuAuthSection.innerHTML = `
                <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 6px; margin-top: 10px;">
                    <p style="margin-bottom: 8px; color: #fff; font-weight: bold;">👤 Hi, ${currentUser.name} ${currentUser.role === 'admin' ? '(Admin)' : ''}</p>
                    <button onclick="userLogout()" style="width: 100%; background: #d32f2f; color: white; border: none; padding: 8px; border-radius: 4px; font-weight: bold; cursor: pointer;">
                        🚪 Logout
                    </button>
                </div>
            `;
        } else {
            menuAuthSection.innerHTML = `
                <a href="login.html" style="background: #2e7d32; color: white; text-align: center; border-radius: 6px; font-weight: bold; display: block; padding: 10px; text-decoration: none;">
                    🔑 Login / Register
                </a>
            `;
        }
    }

    if (authSection) {
        if (currentUser && currentUser.name) {
            authSection.innerHTML = `
                <div class="header-user-badge">
                    <span>👤 Hi, ${currentUser.name}</span>
                    <button onclick="userLogout()" class="header-logout-btn">Logout</button>
                </div>
            `;
        } else {
            authSection.innerHTML = `
                <a href="login.html" class="header-login-btn">
                    🔑 Login
                </a>
            `;
        }
    }
}

window.userLogout = function() {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("user");
        alert("Logged out successfully!");
        window.location.reload();
    }
};

document.addEventListener("DOMContentLoaded", checkUserLogin);

// ================= LOAD BANNERS =================
function loadHomepageBanners() {
    const bannerContainer = document.getElementById("heroBannerContainer");
    if (!bannerContainer) return;

    fetch("https://maimasala-backend.onrender.com/api/banners")
        .then(res => res.json())
        .then(banners => {
            if (!banners.length) return;

            bannerContainer.innerHTML = "";
            banners.forEach(b => {
                const imgUrl = b.image ? `https://maimasala-backend.onrender.com/${b.image}` : '';
                bannerContainer.innerHTML += `
                    <div class="banner-slide" style="margin-bottom: 15px; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        <img src="${imgUrl}" alt="${b.title}" style="width: 100%; max-height: 250px; object-fit: cover; display: block;">
                    </div>
                `;
            });
        })
        .catch(err => console.error("Banner Load Error:", err));
}

document.addEventListener("DOMContentLoaded", loadHomepageBanners);