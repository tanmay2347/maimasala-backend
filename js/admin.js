let allOrdersData = [];
let monthlyChartInstance = null;
let topProductsChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    checkAdminAuth();
    loadDashboardStats();
    loadProfitAnalytics(); // 👈 Load Profit & Loss Analytics
    loadAdminOrders();
    loadCustomerDirectory();
    loadAdminProducts();
    loadAdminBanners();
    loadAdminReviews();

    const addProductForm = document.getElementById("addProductForm");
    if (addProductForm) addProductForm.addEventListener("submit", handleAddProduct);

    const addBannerForm = document.getElementById("addBannerForm");
    if (addBannerForm) addBannerForm.addEventListener("submit", handleAddBanner);
});

// 1. ADMIN SECURITY CHECK
function checkAdminAuth() {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    if (!currentUser || currentUser.role !== "admin") {
        alert("⛔ Access Denied! Only Admin can view this page.");
        window.location.href = "login.html";
    }
}

// 2. LOAD DASHBOARD STATS
async function loadDashboardStats() {
    try {
        const [ordersRes, productsRes] = await Promise.all([
            fetch("https://maimasala-backend.onrender.com/api/orders"),
            fetch("https://maimasala-backend.onrender.com/api/products")
        ]);

        const orders = await ordersRes.json();
        const products = await productsRes.json();

        const totalSales = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

        if (document.getElementById("statTotalSales")) document.getElementById("statTotalSales").innerText = totalSales;
        if (document.getElementById("statTotalOrders")) document.getElementById("statTotalOrders").innerText = orders.length;
        if (document.getElementById("statTotalProducts")) document.getElementById("statTotalProducts").innerText = products.length;

    } catch (err) {
        console.error("Stats loading error:", err);
    }
}

// 📈 3. LOAD PROFIT & LOSS ANALYTICS
async function loadProfitAnalytics() {
    try {
        const res = await fetch("https://maimasala-backend.onrender.com/api/orders/analytics/profit");
        const data = await res.json();

        if (data && data.netProfit !== undefined) {
            if (document.getElementById("statNetProfit")) document.getElementById("statNetProfit").innerText = data.netProfit;
            if (document.getElementById("statProfitMargin")) document.getElementById("statProfitMargin").innerText = data.profitMarginPercent;
        }
    } catch (err) {
        console.error("Profit Analytics fetch error:", err);
    }
}

// 4. LOAD ORDERS MANAGEMENT
async function loadAdminOrders() {
    const container = document.getElementById("ordersTableContainer");
    if (!container) return;

    try {
        const res = await fetch("https://maimasala-backend.onrender.com/api/orders");
        let orders = await res.json();

        if (!orders.length) {
            container.innerHTML = "<p>No customer orders available yet.</p>";
            return;
        }

        allOrdersData = orders.sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));
        renderOrdersTable(allOrdersData);
        renderAnalyticsCharts(allOrdersData);

    } catch (err) {
        container.innerHTML = "<p>Error loading orders from backend.</p>";
    }
}

function renderOrdersTable(ordersToRender) {
    const container = document.getElementById("ordersTableContainer");
    const summaryEl = document.getElementById("orderFilterSummary");

    if (!ordersToRender.length) {
        container.innerHTML = "<p style='padding: 20px; text-align: center; color: #666;'>Is date ya search query par koi order nahi mila.</p>";
        if (summaryEl) summaryEl.innerText = "Total Orders: 0 | Total Amount: ₹0";
        return;
    }

    const filteredTotal = ordersToRender.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    if (summaryEl) {
        summaryEl.innerText = `📊 Showing ${ordersToRender.length} Orders | Total Revenue: ₹${filteredTotal}`;
    }

    let tableHtml = `
        <table border="1" style="width:100%; border-collapse:collapse; margin-top:10px;">
            <thead>
                <tr style="background:#f1f1f1; text-align:left;">
                    <th style="padding:8px;">Date</th>
                    <th style="padding:8px;">Order ID</th>
                    <th style="padding:8px;">Customer</th>
                    <th style="padding:8px;">Phone</th>
                    <th style="padding:8px;">Items</th>
                    <th style="padding:8px;">Total</th>
                    <th style="padding:8px;">Payment</th> <!-- 👈 PAYMENT COLUMN ADDED HERE -->
                    <th style="padding:8px;">Status</th>
                    <th style="padding:8px;">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    ordersToRender.forEach(order => {
        const itemsStr = order.products ? order.products.map(p => `${p.name} (x${p.qty || 1})`).join(", ") : "N/A";
        const orderDateFormatted = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A";
        const orderIdShort = order._id.slice(-6).toUpperCase();

        // 🟢 CHECK PAYMENT METHOD (ONLINE VS COD)
        const isOnlinePaid = order.paymentMethod === 'Online' || order.paymentStatus === 'Paid';
        const paymentBadge = isOnlinePaid 
            ? `<span style="background:#e8f5e9; color:#2e7d32; padding:3px 6px; border-radius:4px; font-weight:bold; font-size:11px;">🟢 Online (Paid)</span>` 
            : `<span style="background:#fff3e0; color:#e65100; padding:3px 6px; border-radius:4px; font-weight:bold; font-size:11px;">💵 COD (Pending)</span>`;

        let cleanPhone = (order.phone || "").replace(/\D/g, "");
        if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

        const customMessage = encodeURIComponent(
            `Namaste ${order.customerName} ji! 🌶️ MaiMasala se aapka order #${orderIdShort} (Amount: ₹${order.total}) confirm ho chuka hai. Status: ${order.status}. Dhanyawad!`
        );
        const waUrl = `https://wa.me/${cleanPhone}?text=${customMessage}`;

        tableHtml += `
            <tr>
                <td style="padding:8px;"><small style="font-weight:bold; color:#555;">📅 ${orderDateFormatted}</small></td>
                <td style="padding:8px;"><strong>#${orderIdShort}</strong></td>
                <td style="padding:8px;">${order.customerName}<br><small style="color:#777">${order.address}</small></td>
                <td style="padding:8px;">${order.phone}</td>
                <td style="padding:8px;">${itemsStr}</td>
                <td style="padding:8px;"><strong>₹${order.total}</strong></td>
                <td style="padding:8px;">${paymentBadge}</td> <!-- 👈 RENDER PAYMENT BADGE HERE -->
                <td style="padding:8px;">
                    <select onchange="updateOrderStatus('${order._id}', this.value)" style="padding:4px; border-radius:4px; width: 100%;">
                        <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td style="padding:8px;">
                    <a href="${waUrl}" target="_blank" style="background:#25D366; color:white; text-decoration:none; padding:5px 8px; border-radius:4px; font-weight:bold; font-size:11px; display:inline-flex; align-items:center; gap:4px; margin-bottom:4px; width:100%;">
                        💬 WhatsApp
                    </a>
                    <button onclick="downloadInvoice('${order._id}')" style="background:#0275d8; color:white; border:none; padding:5px 8px; border-radius:4px; font-weight:bold; font-size:11px; display:inline-flex; align-items:center; gap:4px; cursor:pointer; width:100%;">
                        📄 PDF Bill
                    </button>
                </td>
            </tr>
        `;
    });

    tableHtml += "</tbody></table>";
    container.innerHTML = tableHtml;
}

// 🏷️ ONE-CLICK BULK SHIPPING LABELS GENERATOR (4 LABELS PER A4 PAGE)
window.generateBulkShippingLabels = function() {
    if (!allOrdersData || !allOrdersData.length) {
        return alert("Shipping labels generate karne ke liye koi orders nahi hain!");
    }

    const activeOrders = allOrdersData.filter(o => o.status !== 'Cancelled');

    if (!activeOrders.length) {
        return alert("Koi valid orders available nahi hain!");
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const labelWidth = 90;
    const labelHeight = 120;
    const startX = 10;
    const startY = 10;
    const gapX = 10;
    const gapY = 15;

    let itemsOnPage = 0;

    activeOrders.forEach((order) => {
        if (itemsOnPage === 4) {
            doc.addPage();
            itemsOnPage = 0;
        }

        const col = itemsOnPage % 2;
        const row = Math.floor(itemsOnPage / 2);

        const x = startX + col * (labelWidth + gapX);
        const y = startY + row * (labelHeight + gapY);

        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.4);
        doc.rect(x, y, labelWidth, labelHeight);

        doc.setFillColor(211, 47, 47);
        doc.rect(x, y, labelWidth, 14, 'F');

        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text("MaiMasala Spices", x + 5, y + 9);

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text("PREPAID / COD", x + labelWidth - 25, y + 9);

        const orderIdShort = order._id.slice(-6).toUpperCase();
        const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "N/A";

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text(`Order ID: #${orderIdShort}`, x + 5, y + 20);
        doc.setFont(undefined, 'normal');
        doc.text(`Date: ${orderDate}`, x + labelWidth - 35, y + 20);

        doc.setDrawColor(220, 220, 220);
        doc.line(x + 5, y + 23, x + labelWidth - 5, y + 23);

        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text("DELIVER TO:", x + 5, y + 29);

        doc.setFontSize(10);
        doc.setTextColor(211, 47, 47);
        doc.text(`${order.customerName || 'Customer'}`, x + 5, y + 35);

        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        doc.setFont(undefined, 'normal');

        const splitAddr = doc.splitTextToSize(`${order.address || 'N/A'}`, labelWidth - 10);
        doc.text(splitAddr, x + 5, y + 41);

        const addrYOffset = y + 41 + (splitAddr.length * 4);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`Phone: +91 ${order.phone || 'N/A'}`, x + 5, addrYOffset + 2);

        doc.line(x + 5, addrYOffset + 5, x + labelWidth - 5, addrYOffset + 5);

        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.text("PACKING ITEMS:", x + 5, addrYOffset + 10);

        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        let itemsY = addrYOffset + 14;

        if (order.products && order.products.length > 0) {
            order.products.forEach(p => {
                const itemText = doc.splitTextToSize(`• ${p.name} (x${p.qty || 1})`, labelWidth - 10);
                if (itemsY < y + labelHeight - 18) {
                    doc.text(itemText, x + 5, itemsY);
                    itemsY += (itemText.length * 3.5);
                }
            });
        }

        doc.setFillColor(245, 245, 245);
        doc.rect(x, y + labelHeight - 14, labelWidth, 14, 'F');

        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text("RETURN IF UNDELIVERED TO:", x + 5, y + labelHeight - 9);
        doc.setFont(undefined, 'normal');
        doc.text("MaiMasala Works, Amravati, MH, PIN-444601", x + 5, y + labelHeight - 5);

        itemsOnPage++;
    });

    doc.save(`MaiMasala_Bulk_Shipping_Labels_${new Date().toISOString().split('T')[0]}.pdf`);
};

// 📋 COURIER DISPATCH MANIFEST SHEET GENERATOR
window.generateCourierManifest = function() {
    if (!allOrdersData || !allOrdersData.length) {
        return alert("Courier manifest generate karne ke liye koi orders nahi hain!");
    }

    const activeOrders = allOrdersData.filter(o => o.status !== 'Cancelled');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(211, 47, 47);
    doc.setFont(undefined, 'bold');
    doc.text("MaiMasala - Daily Courier Dispatch Manifest", 14, 18);

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont(undefined, 'normal');
    doc.text(`Manifest Date: ${new Date().toLocaleDateString("en-IN")}`, 14, 25);
    doc.text(`Total Packages Handed Over: ${activeOrders.length} Shipments`, 14, 30);

    doc.setLineWidth(0.4);
    doc.line(14, 34, 196, 34);

    const tableColumn = ["Sr.", "Order ID", "Customer Name", "Destination Address", "Phone", "Amount (Rs)", "Courier Sign"];
    const tableRows = [];

    activeOrders.forEach((order, idx) => {
        const orderIdShort = "#" + order._id.slice(-6).toUpperCase();
        tableRows.push([
            idx + 1,
            orderIdShort,
            order.customerName || 'N/A',
            (order.address || '').slice(0, 35) + '...',
            order.phone || 'N/A',
            `Rs. ${order.total}/-`,
            " [   ] Handed"
        ]);
    });

    doc.autoTable({
        startY: 38,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [211, 47, 47], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 22 },
            2: { cellWidth: 32 },
            3: { cellWidth: 55 },
            4: { cellWidth: 28 },
            5: { cellWidth: 22 },
            6: { cellWidth: 25 }
        }
    });

    const finalY = doc.lastAutoTable.finalY || 100;

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0);
    doc.text("Courier Person Name: _______________________", 14, finalY + 20);
    doc.text("Courier Signature / Seal: _______________________", 120, finalY + 20);

    doc.save(`Courier_Dispatch_Manifest_${new Date().toISOString().split('T')[0]}.pdf`);
};

// 5. LOAD CUSTOMER DIRECTORY & LTV
async function loadCustomerDirectory() {
    const tableBody = document.getElementById("customerDirectoryTable");
    if (!tableBody) return;

    try {
        const res = await fetch("https://maimasala-backend.onrender.com/api/orders/customers/directory");
        const customers = await res.json();

        if (!customers.length) {
            tableBody.innerHTML = "<tr><td colspan='7'>No customers registered yet.</td></tr>";
            return;
        }

        tableBody.innerHTML = "";
        customers.forEach(c => {
            let cleanPhone = (c.phone || "").replace(/\D/g, "");
            if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

            const waMsg = encodeURIComponent(`Namaste ${c.customerName} ji! 🌶️ MaiMasala se aapke liye special offer discounts active hain! Check out our store.`);
            const waUrl = `https://wa.me/${cleanPhone}?text=${waMsg}`;
            const lastDate = c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString("en-IN") : "N/A";

            tableBody.innerHTML += `
                <tr>
                    <td><strong>${c.customerName || 'N/A'}</strong></td>
                    <td>${c.phone || 'N/A'}</td>
                    <td><small style="color:#555;">${c.address || 'N/A'}</small></td>
                    <td><span style="background:#e3f2fd; color:#0d47a1; padding:3px 8px; border-radius:12px; font-weight:bold; font-size:12px;">${c.totalOrders} Orders</span></td>
                    <td><strong style="color:#2e7d32; font-size:15px;">₹${c.lifetimeSpend}</strong></td>
                    <td><small style="color:#777;">📅 ${lastDate}</small></td>
                    <td>
                        <a href="${waUrl}" target="_blank" style="background:#25D366; color:white; text-decoration:none; padding:5px 10px; border-radius:4px; font-weight:bold; font-size:11px; display:inline-block;">
                            💬 Offer WhatsApp
                        </a>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Customer directory error:", err);
        tableBody.innerHTML = "<tr><td colspan='7'>Failed to load customer directory.</td></tr>";
    }
}

// DATE & SEARCH FILTER
window.filterOrdersByDate = function() {
    const selectedDate = document.getElementById("orderDateFilter")?.value;
    const searchQuery = document.getElementById("orderSearchInput")?.value?.toLowerCase() || "";

    let filtered = allOrdersData;

    if (selectedDate) {
        filtered = filtered.filter(order => {
            if (!order.createdAt) return false;
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
            return orderDate === selectedDate;
        });
    }

    if (searchQuery) {
        filtered = filtered.filter(order => {
            const nameMatch = (order.customerName || "").toLowerCase().includes(searchQuery);
            const phoneMatch = (order.phone || "").toLowerCase().includes(searchQuery);
            const idMatch = (order._id || "").toLowerCase().includes(searchQuery);
            return nameMatch || phoneMatch || idMatch;
        });
    }

    renderOrdersTable(filtered);
};

window.clearOrderFilter = function() {
    if (document.getElementById("orderDateFilter")) document.getElementById("orderDateFilter").value = "";
    if (document.getElementById("orderSearchInput")) document.getElementById("orderSearchInput").value = "";
    renderOrdersTable(allOrdersData);
};

async function updateOrderStatus(orderId, newStatus) {
    try {
        const res = await fetch(`https://maimasala-backend.onrender.com/api/orders/${orderId}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            alert("Order status updated to: " + newStatus);
            loadDashboardStats();
            loadProfitAnalytics();

            const targetOrder = allOrdersData.find(o => o._id === orderId);
            if (targetOrder && targetOrder.phone) {
                const sendWA = confirm(`Kya aap ${targetOrder.customerName} ko WhatsApp par status update ("${newStatus}") bhejna chahte hain?`);
                if (sendWA) {
                    let cleanPhone = (targetOrder.phone || "").replace(/\D/g, "");
                    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

                    const msg = encodeURIComponent(
                        `Hello ${targetOrder.customerName}! 🌶️ MaiMasala se aapke order #${orderId.slice(-6).toUpperCase()} ka status update ho gaya hai. Naya Status: *${newStatus}*. Thank you for shopping with us!`
                    );
                    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
                }
            }
        }
    } catch (err) {
        alert("Failed to update status");
    }
}

// LOAD INVENTORY
async function loadAdminProducts() {
    const list = document.getElementById("inventoryTable");
    if (!list) return;

    try {
        const res = await fetch("https://maimasala-backend.onrender.com/api/products");
        const products = await res.json();

        if (!products.length) {
            list.innerHTML = "<tr><td colspan='6'>No products added yet.</td></tr>";
            return;
        }

        const lowStockItems = products.filter(p => p.outOfStock || (p.stock !== undefined && p.stock <= 5));
        const alertBanner = document.getElementById("lowStockAlert");
        const alertMsg = document.getElementById("lowStockMessage");

        if (lowStockItems.length > 0 && alertBanner && alertMsg) {
            const itemNames = lowStockItems.map(p => p.name).join(", ");
            alertMsg.innerHTML = `Kuch products out of stock hain ya unki quantity kam bachi hai: <strong>${itemNames}</strong>`;
            alertBanner.style.display = "block";
        } else if (alertBanner) {
            alertBanner.style.display = "none";
        }

        list.innerHTML = "";
        products.forEach(p => {
            const imgUrl = p.image ? `https://maimasala-backend.onrender.com/${p.image}` : 'https://via.placeholder.com/50';
            const currentStock = p.stock !== undefined ? p.stock : 20;

            const p100 = (p.variants && p.variants[0]) ? p.variants[0].price : p.price;
            const p250 = (p.variants && p.variants[1]) ? p.variants[1].price : Math.round(p100 * 2.3);
            const p500 = (p.variants && p.variants[2]) ? p.variants[2].price : Math.round(p100 * 4.2);
            const p1k  = (p.variants && p.variants[3]) ? p.variants[3].price : Math.round(p100 * 8);

            list.innerHTML += `
                <tr style="${p.outOfStock || currentStock <= 5 ? 'background-color: #fff8e1;' : ''}">
                    <td><img src="${imgUrl}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 4px;" onerror="this.src='https://via.placeholder.com/45'"></td>
                    <td><strong>${p.name}</strong></td>
                    
                    <td>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px;">
                            <label>100g: ₹<input type="number" id="v100_${p._id}" value="${p100}" style="width:50px; padding:2px; border:1px solid #ccc; border-radius:3px;"></label>
                            <label>250g: ₹<input type="number" id="v250_${p._id}" value="${p250}" style="width:50px; padding:2px; border:1px solid #ccc; border-radius:3px;"></label>
                            <label>500g: ₹<input type="number" id="v500_${p._id}" value="${p500}" style="width:50px; padding:2px; border:1px solid #ccc; border-radius:3px;"></label>
                            <label>1kg: ₹<input type="number" id="v1k_${p._id}" value="${p1k}" style="width:50px; padding:2px; border:1px solid #ccc; border-radius:3px;"></label>
                        </div>
                        <button onclick="updateProductVariants('${p._id}')" style="background:#0275d8; color:white; border:none; padding:3px 8px; border-radius:3px; margin-top:5px; font-size:10px; cursor:pointer; font-weight:bold;">
                            💾 Save Variant Prices
                        </button>
                    </td>

                    <td>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <input type="number" id="stockInput_${p._id}" value="${currentStock}" min="0" style="width: 55px; padding: 4px; border: 1px solid #ccc; border-radius: 4px; font-weight: bold; text-align: center;">
                            <button onclick="updateProductStock('${p._id}')" style="background: #2e7d32; color: white; border: none; padding: 4px 6px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;">
                                💾
                            </button>
                        </div>
                    </td>
                    <td>
                        <span style="color: ${p.outOfStock || currentStock === 0 ? 'red' : 'green'}; font-weight: bold;">
                            ${p.outOfStock || currentStock === 0 ? '⚠️ OUT OF STOCK' : '🟢 IN STOCK'}
                        </span>
                    </td>
                    <td>
                        <button onclick="toggleStock('${p._id}', ${!p.outOfStock})" style="background:#f57c00; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px;">
                            ${p.outOfStock ? 'Mark In Stock' : 'Mark Out of Stock'}
                        </button>
                        <button onclick="deleteProduct('${p._id}')" style="background:#ff4d4d; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px;">
                            🗑️ Delete
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        list.innerHTML = "<tr><td colspan='6'>Failed to load inventory.</td></tr>";
    }
}

window.updateProductVariants = async function(productId) {
    const p100 = Number(document.getElementById(`v100_${productId}`).value);
    const p250 = Number(document.getElementById(`v250_${productId}`).value);
    const p500 = Number(document.getElementById(`v500_${productId}`).value);
    const p1k  = Number(document.getElementById(`v1k_${productId}`).value);

    const newVariants = [
        { weight: "100g", price: p100 },
        { weight: "250g", price: p250 },
        { weight: "500g", price: p500 },
        { weight: "1kg",  price: p1k }
    ];

    try {
        const res = await fetch(`https://maimasala-backend.onrender.com/api/products/${productId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                price: p100,
                variants: JSON.stringify(newVariants) 
            })
        });

        if (res.ok) {
            alert("✅ Variant prices updated successfully!");
            loadAdminProducts();
        } else {
            alert("Failed to update variants.");
        }
    } catch (err) {
        alert("Server error while updating variant prices.");
    }
};

window.updateProductStock = async function(productId) {
    const inputEl = document.getElementById(`stockInput_${productId}`);
    if (!inputEl) return;

    const newStock = Number(inputEl.value);

    if (isNaN(newStock) || newStock < 0) {
        alert("Please enter a valid stock number!");
        return;
    }

    try {
        const res = await fetch(`https://maimasala-backend.onrender.com/api/products/${productId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                stock: newStock,
                outOfStock: newStock === 0 ? true : false
            })
        });

        if (res.ok) {
            alert(`✅ Stock updated to ${newStock} packets!`);
            loadAdminProducts();
        } else {
            alert("Failed to update stock.");
        }
    } catch (err) {
        alert("Server error while updating stock.");
    }
};

// ADD PRODUCT HANDLER WITH COST PRICE & RECIPE
async function handleAddProduct(e) {
    e.preventDefault();

    const price100El = document.getElementById("price100g");
    const price100 = price100El ? Number(price100El.value) : 100;
    const costPrice100 = document.getElementById("costPrice100g") ? Number(document.getElementById("costPrice100g").value) : Math.round(price100 * 0.6);
    
    const price250Val = document.getElementById("price250g")?.value;
    const price500Val = document.getElementById("price500g")?.value;
    const price1kVal = document.getElementById("price1kg")?.value;

    const price250 = price250Val ? Number(price250Val) : Math.round(price100 * 2.3);
    const price500 = price500Val ? Number(price500Val) : Math.round(price100 * 4.2);
    const price1k = price1kVal ? Number(price1kVal) : Math.round(price100 * 8);

    const variants = [
        { weight: "100g", price: price100, costPrice: costPrice100 },
        { weight: "250g", price: price250, costPrice: Math.round(costPrice100 * 2.3) },
        { weight: "500g", price: price500, costPrice: Math.round(costPrice100 * 4.2) },
        { weight: "1kg", price: price1k, costPrice: Math.round(costPrice100 * 8) }
    ];

    const formData = new FormData();
    formData.append("name", document.getElementById("productName").value);
    formData.append("price", price100);
    formData.append("costPrice", costPrice100);
    formData.append("stock", document.getElementById("productStock") ? document.getElementById("productStock").value : 20);
    formData.append("description", document.getElementById("productDesc").value);
    formData.append("image", document.getElementById("productImage").files[0]);
    formData.append("variants", JSON.stringify(variants));
    formData.append("usage", document.getElementById("productUsage")?.value || "Best for authentic Indian cooking.");
    formData.append("recipe", document.getElementById("productRecipe")?.value || "Add while frying spices to release natural aroma.");

    try {
        const res = await fetch("https://maimasala-backend.onrender.com/api/products", {
            method: "POST",
            body: formData
        });

        if (res.ok) {
            alert("🌶️ New Product with Cost Price & Recipe Ideas Uploaded Successfully!");
            document.getElementById("addProductForm").reset();
            loadDashboardStats();
            loadProfitAnalytics();
            loadAdminProducts();
        } else {
            alert("Failed to upload product.");
        }
    } catch (err) {
        alert("Server error while uploading product.");
    }
}

window.toggleStock = async function(id, outOfStock) {
    try {
        const res = await fetch(`https://maimasala-backend.onrender.com/api/products/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ outOfStock: outOfStock })
        });
        if (res.ok) {
            alert(outOfStock ? "🔴 Marked as OUT OF STOCK" : "🟢 Marked as IN STOCK");
            loadAdminProducts();
        }
    } catch (err) {
        alert("Error changing stock status.");
    }
};

window.deleteProduct = async function(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
        const res = await fetch(`https://maimasala-backend.onrender.com/api/products/${id}`, { method: "DELETE" });
        if (res.ok) {
            alert("Product deleted!");
            loadDashboardStats();
            loadProfitAnalytics();
            loadAdminProducts();
        }
    } catch (err) {
        alert("Error deleting product");
    }
};

window.exportOrdersToExcel = function() {
    if (!allOrdersData || !allOrdersData.length) return alert("Export karne ke liye koi orders nahi hain!");
    
    const excelData = allOrdersData.map(order => ({
        "Order Date": order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "N/A",
        "Order ID": "#" + order._id.slice(-6).toUpperCase(),
        "Customer Name": order.customerName || "N/A",
        "Phone Number": order.phone || "N/A",
        "Address": order.address || "N/A",
        "Items Ordered": order.products ? order.products.map(p => `${p.name} (x${p.qty || 1})`).join(", ") : "N/A",
        "Total Amount (INR)": order.total || 0,
        "Payment Mode": order.paymentMethod || "COD",
        "Status": order.status || "Pending"
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Orders");
    XLSX.writeFile(workbook, `MaiMasala_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
};

let previousOrderCount = null;
function checkNewOrdersNotification() {
    fetch("https://maimasala-backend.onrender.com/api/orders")
        .then(res => res.json())
        .then(orders => {
            if (previousOrderCount === null) {
                previousOrderCount = orders.length;
                return;
            }
            if (orders.length > previousOrderCount) {
                playNotificationBeep();
                alert("🔔 NAYA ORDER AAYA HAI! Please check the orders list.");
                loadAdminOrders();
                loadDashboardStats();
                loadProfitAnalytics();
                loadCustomerDirectory();
            }
            previousOrderCount = orders.length;
        })
        .catch(err => console.error("Notification Check Error:", err));
}

function playNotificationBeep() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) { }
}
setInterval(checkNewOrdersNotification, 10000);

window.downloadInvoice = function(orderId) {
    const order = allOrdersData.find(o => o._id === orderId);
    if(!order) return alert("Order not found!");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(211, 47, 47);
    doc.text("MaiMasala", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Amravati, Maharashtra, India", 14, 28);
    doc.text("Phone: +91 9000000000 | Email: support@maimasala.com", 14, 34);

    doc.setLineWidth(0.5);
    doc.line(14, 38, 196, 38);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Bill To:", 14, 48);
    
    doc.setFontSize(10);
    doc.text(`Name: ${order.customerName || 'N/A'}`, 14, 55);
    doc.text(`Phone: ${order.phone || 'N/A'}`, 14, 61);
    
    const splitAddress = doc.splitTextToSize(`Address: ${order.address || 'N/A'}`, 80);
    doc.text(splitAddress, 14, 67);

    const orderIdShort = order._id.slice(-6).toUpperCase();
    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "N/A";
    
    const isOnlinePaid = order.paymentMethod === 'Online' || order.paymentStatus === 'Paid';
    const paymentText = isOnlinePaid ? 'Online Payment (PAID)' : 'Cash on Delivery (COD)';

    doc.setFontSize(10);
    doc.text(`Order ID: #${orderIdShort}`, 130, 48);
    doc.text(`Date: ${orderDate}`, 130, 55);
    doc.text(`Status: ${order.status || 'Pending'}`, 130, 61);
    doc.text(`Payment Mode: ${paymentText}`, 130, 67);

    const tableColumn = ["Sr. No.", "Item Description", "Qty", "Unit Price (Rs)", "Total Amount (Rs)"];
    const tableRows = [];

    if (order.products && order.products.length > 0) {
        order.products.forEach((item, index) => {
            const itemData = [
                index + 1,
                item.name,
                item.qty || 1,
                `${item.price}`,
                `${(item.price * (item.qty || 1))}`
            ];
            tableRows.push(itemData);
        });
    }

    doc.autoTable({
        startY: Math.max(75, 67 + (splitAddress.length * 5)),
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [211, 47, 47] }
    });

    const finalY = doc.lastAutoTable.finalY || 100;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont(undefined, 'bold');
    doc.text(`Grand Total: Rs. ${order.total}/-`, 140, finalY + 15);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(150);
    doc.text("Thank you for shopping authentic spices with MaiMasala!", 105, 280, null, null, "center");

    doc.save(`MaiMasala_Invoice_${orderIdShort}.pdf`);
};

function renderAnalyticsCharts(orders) {
    if (!orders || !orders.length) return;

    const monthlySales = {};
    const productSalesCount = {};

    orders.forEach(order => {
        if (order.createdAt) {
            const date = new Date(order.createdAt);
            const monthYear = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
            monthlySales[monthYear] = (monthlySales[monthYear] || 0) + (Number(order.total) || 0);
        }

        if (order.products && Array.isArray(order.products)) {
            order.products.forEach(item => {
                const pName = item.name || "Unknown Spice";
                const pQty = Number(item.qty) || 1;
                productSalesCount[pName] = (productSalesCount[pName] || 0) + pQty;
            });
        }
    });

    const monthLabels = Object.keys(monthlySales).reverse();
    const monthData = monthLabels.map(m => monthlySales[m]);

    const ctxMonthly = document.getElementById("monthlySalesChart")?.getContext("2d");
    if (ctxMonthly) {
        if (monthlyChartInstance) monthlyChartInstance.destroy();

        monthlyChartInstance = new Chart(ctxMonthly, {
            type: "bar",
            data: {
                labels: monthLabels.length ? monthLabels : ["Current Month"],
                datasets: [{
                    label: "Revenue (₹)",
                    data: monthData.length ? monthData : [0],
                    backgroundColor: "rgba(211, 47, 47, 0.75)",
                    borderColor: "#d32f2f",
                    borderWidth: 1.5,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    const sortedProducts = Object.entries(productSalesCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const productLabels = sortedProducts.map(p => p[0]);
    const productData = sortedProducts.map(p => p[1]);

    const ctxProducts = document.getElementById("topProductsChart")?.getContext("2d");
    if (ctxProducts) {
        if (topProductsChartInstance) topProductsChartInstance.destroy();

        topProductsChartInstance = new Chart(ctxProducts, {
            type: "doughnut",
            data: {
                labels: productLabels.length ? productLabels : ["No Sales Yet"],
                datasets: [{
                    data: productData.length ? productData : [1],
                    backgroundColor: [
                        "#d32f2f",
                        "#f57c00",
                        "#2e7d32",
                        "#0275d8",
                        "#8e24aa"
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "bottom" }
                }
            }
        });
    }
}

async function loadAdminBanners() {
    const container = document.getElementById("bannerListContainer");
    if (!container) return;

    try {
        const res = await fetch("https://maimasala-backend.onrender.com/api/banners");
        const banners = await res.json();

        if (!banners.length) {
            container.innerHTML = "<p style='color:#666;'>No banners uploaded yet.</p>";
            return;
        }

        container.innerHTML = "";
        banners.forEach(b => {
            const imgUrl = b.image ? `https://maimasala-backend.onrender.com/${b.image}` : 'https://via.placeholder.com/300x120';

            container.innerHTML += `
                <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <img src="${imgUrl}" style="width: 100%; height: 130px; object-fit: cover;" onerror="this.src='https://via.placeholder.com/300x120'">
                    <div style="padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                        <strong style="font-size: 14px; color: #333;">${b.title}</strong>
                        <button onclick="deleteBanner('${b._id}')" style="background: #ff4d4d; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            `;
        });

    } catch (err) {
        container.innerHTML = "<p>Error loading banners.</p>";
    }
}

async function handleAddBanner(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", document.getElementById("bannerTitle").value);
    formData.append("image", document.getElementById("bannerImage").files[0]);

    try {
        const res = await fetch("https://maimasala-backend.onrender.com/api/banners", {
            method: "POST",
            body: formData
        });

        if (res.ok) {
            alert("🖼️ Banner Uploaded Successfully!");
            document.getElementById("addBannerForm").reset();
            loadAdminBanners();
        } else {
            alert("Failed to upload banner.");
        }
    } catch (err) {
        alert("Server error uploading banner.");
    }
}

window.deleteBanner = async function(id) {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
        const res = await fetch(`https://maimasala-backend.onrender.com/api/banners/${id}`, { method: "DELETE" });
        if (res.ok) {
            alert("Banner deleted!");
            loadAdminBanners();
        }
    } catch (err) {
        alert("Error deleting banner.");
    }
};

async function loadAdminReviews() {
    const list = document.getElementById("reviewsTable");
    if (!list) return;

    try {
        const res = await fetch("https://maimasala-backend.onrender.com/api/reviews/all");
        const reviews = await res.json();

        if (!reviews.length) {
            list.innerHTML = "<tr><td colspan='6'>No customer reviews submitted yet.</td></tr>";
            return;
        }

        list.innerHTML = "";
        reviews.forEach(r => {
            const stars = "⭐".repeat(r.rating || 5);

            list.innerHTML += `
                <tr>
                    <td><strong>${r.customerName}</strong></td>
                    <td>${r.productName}</td>
                    <td>${stars} (${r.rating}/5)</td>
                    <td><small style="color:#555;">"${r.comment}"</small></td>
                    <td>
                        <span style="color: ${r.isApproved ? 'green' : '#d32f2f'}; font-weight: bold;">
                            ${r.isApproved ? '🟢 APPROVED' : '🔴 PENDING'}
                        </span>
                    </td>
                    <td>
                        <button onclick="toggleReviewStatus('${r._id}', ${!r.isApproved})" style="background: ${r.isApproved ? '#666' : '#2e7d32'}; color: white; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; margin-right: 4px;">
                            ${r.isApproved ? 'Unapprove' : 'Approve'}
                        </button>
                        <button onclick="deleteReview('${r._id}')" style="background: #ff4d4d; color: white; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;">
                            🗑️ Delete
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        list.innerHTML = "<tr><td colspan='6'>Failed to load reviews.</td></tr>";
    }
}

window.toggleReviewStatus = async function(id, isApproved) {
    try {
        const res = await fetch(`https://maimasala-backend.onrender.com/api/reviews/${id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isApproved: isApproved })
        });

        if (res.ok) {
            alert(isApproved ? "🟢 Review Approved for Public Website!" : "🔴 Review Unapproved");
            loadAdminReviews();
        }
    } catch (err) {
        alert("Error changing review status.");
    }
};

window.deleteReview = async function(id) {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
        const res = await fetch(`https://maimasala-backend.onrender.com/api/reviews/${id}`, { method: "DELETE" });
        if (res.ok) {
            alert("Review deleted!");
            loadAdminReviews();
        }
    } catch (err) {
        alert("Error deleting review.");
    }
};