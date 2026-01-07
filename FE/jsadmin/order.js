window.orderModule = (function () {
    // ========== STATE ==========
    let allOrders = [];
    let filteredOrders = [];
    let currentPage = 1;
    let customers = [];
    let products = [];
    let variants = [];

    // ========== UTILITIES ==========
    function getToken() {
        return localStorage.getItem('token');
    }

    function formatCurrency(amount) {
        return Number(amount || 0).toLocaleString('vi-VN') + ' ₫';
    }

    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleString('vi-VN');
    }

    function showError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        if (errorEl) {
            errorEl.innerText = message;
            errorEl.style.display = 'block';
        }
    }

    function hideError(elementId) {
        const errorEl = document.getElementById(elementId);
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }

    // ========== DATA LOADING ==========
    async function loadOrders() {
        const token = getToken();
        const out = document.getElementById('results');

        if (!out) return;
        if (!token) {
            out.innerText = 'No token available. Please login as admin.';
            return;
        }

        try {
            const res = await fetch('/api/orders', { headers: { authorization: token } });
            const data = await res.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to load orders');
            }

            allOrders = data.orders || [];
            filteredOrders = [...allOrders];
            currentPage = 1;
            renderTable();
        } catch (err) {
            out.innerText = `Error loading orders: ${err.message}`;
        }
    }

    async function loadCustomersAndProducts() {
        const token = getToken();

        try {
            const [custRes, prodRes, varRes] = await Promise.all([
                fetch('/api/customers', { headers: { authorization: token } }),
                fetch('/api/products', { headers: { authorization: token } }),
                fetch('/api/productvariants', { headers: { authorization: token } })
            ]);

            const custData = await custRes.json();
            const prodData = await prodRes.json();
            const varData = await varRes.json();

            customers = custData.success ? custData.customers : [];
            products = prodData.success ? prodData.products : [];
            variants = varData.success ? varData.variants : [];
        } catch (err) {
            console.error('Error loading data:', err);
        }
    }

    // ========== UI RENDERING ==========
    function renderTable() {
        const entriesSelect = document.getElementById('entriesPerPage');
        const resultsContainer = document.getElementById('results');

        if (!entriesSelect || !resultsContainer) return;

        const perPage = parseInt(entriesSelect.value) || 10;
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        const pageData = filteredOrders.slice(start, end);

        let html = `
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th style="width:50px">#</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th style="width:250px">Action</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        pageData.forEach((order, idx) => {
            const rowNum = start + idx + 1;
            const customerName = order.customer?.name || 'Unknown';
            const itemsCount = order.items?.length || 0;
            const total = formatCurrency(order.totalAmount);
            const date = formatDate(order.createdAt);
            const status = order.status || 'pending';

            html += `
                <tr>
                    <td>${rowNum}</td>
                    <td>${customerName}</td>
                    <td>${itemsCount} item(s)</td>
                    <td>${total}</td>
                    <td><span class="status ${status}">${status}</span></td>
                    <td>${date}</td>
                    <td class="action">
                        <div class="action-btns">
                            <button class="btn btn-info" onclick="viewOrder('${order._id}')">View</button>
                            <button class="btn btn-warning" onclick="updateStatus('${order._id}', '${status}')">Update</button>
                            <button class="btn btn-danger" onclick="deleteOrder('${order._id}')">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        resultsContainer.innerHTML = html;
        renderPagination(perPage);
        updatePaginationInfo(start, end, perPage);
    }

    function renderPagination(perPage) {
        const totalPages = Math.max(1, Math.ceil(filteredOrders.length / perPage));
        const maxButtons = 7;
        const pagination = document.getElementById('pagination');

        if (!pagination) return;

        const buttons = [];

        // Previous buttons
        if (currentPage > 1) {
            buttons.push(`<button class="btn" onclick="goToPage(1)"><<</button>`);
            buttons.push(`<button class="btn" onclick="goToPage(${currentPage - 1})"><</button>`);
        } else {
            buttons.push(`<span class="btn disabled"><<</span>`);
            buttons.push(`<span class="btn disabled"><</span>`);
        }

        // Page numbers
        if (totalPages <= maxButtons) {
            for (let i = 1; i <= totalPages; i++) {
                const active = i === currentPage ? 'btn active' : 'btn';
                buttons.push(`<button class="${active}" onclick="goToPage(${i})">${i}</button>`);
            }
        } else {
            const left = Math.max(2, currentPage - 2);
            const right = Math.min(totalPages - 1, currentPage + 2);

            buttons.push(`<button class="${currentPage === 1 ? 'btn active' : 'btn'}" onclick="goToPage(1)">1</button>`);

            if (left > 2) {
                buttons.push(`<span class="ellipsis">...</span>`);
            }

            for (let i = left; i <= right; i++) {
                const active = i === currentPage ? 'btn active' : 'btn';
                buttons.push(`<button class="${active}" onclick="goToPage(${i})">${i}</button>`);
            }

            if (right < totalPages - 1) {
                buttons.push(`<span class="ellipsis">...</span>`);
            }

            buttons.push(`<button class="${currentPage === totalPages ? 'btn active' : 'btn'}" onclick="goToPage(${totalPages})">${totalPages}</button>`);
        }

        // Next buttons
        if (currentPage < totalPages) {
            buttons.push(`<button class="btn" onclick="goToPage(${currentPage + 1})">></button>`);
            buttons.push(`<button class="btn" onclick="goToPage(${totalPages})">>></button>`);
        } else {
            buttons.push(`<span class="btn disabled">></span>`);
            buttons.push(`<span class="btn disabled">>></span>`);
        }

        pagination.innerHTML = buttons.join('');
    }

    function updatePaginationInfo(start, end, perPage) {
        const infoText = document.getElementById('infoText');
        if (infoText) {
            const showing = filteredOrders.length > 0 ? `${start + 1} to ${Math.min(end, filteredOrders.length)}` : '0';
            infoText.innerText = `Showing ${showing} of ${filteredOrders.length} entries (filtered from ${allOrders.length} total)`;
        }
    }

    // ========== MODAL MANAGEMENT ==========
    function openOrderModal() {
        const modalTitle = document.getElementById('modalTitle');
        const totalAmount = document.getElementById('totalAmount');
        const modalError = document.getElementById('modalError');
        const orderModal = document.getElementById('orderModal');

        if (!modalTitle || !totalAmount || !modalError || !orderModal) {
            console.error('Modal elements not found');
            return;
        }

        modalTitle.innerText = 'Create Order';
        populateProductSelects();
        populateCustomerSelect();
        totalAmount.innerText = formatCurrency(0);
        hideError('modalError');
        orderModal.classList.add('show');
    }

    function closeOrderModal() {
        const orderModal = document.getElementById('orderModal');
        if (orderModal) {
            orderModal.classList.remove('show');
        }
    }

    function closeOrderDetailsModal() {
        const orderDetailsModal = document.getElementById('orderDetailsModal');
        if (orderDetailsModal) {
            orderDetailsModal.classList.remove('show');
            orderDetailsModal.style.display = 'none';
            const content = document.getElementById('orderDetailsContent');
            if (content) content.innerHTML = '';
        }
    }

    // ========== ORDER FORM ==========
    function populateProductSelects() {
        const container = document.getElementById('orderItems');
        if (!container) return;

        container.innerHTML = createOrderItemHTML();
    }

    function populateCustomerSelect() {
        const sel = document.getElementById('orderCustomer');
        if (!sel) return;
        // preserve current selection
        const cur = sel.value;
        sel.innerHTML = '<option value="">Select Customer</option>';
        customers.forEach(c => {
            const o = document.createElement('option');
            o.value = c._id;
            o.textContent = `${c.name} ${c.email ? '(' + c.email + ')' : ''}`;
            sel.appendChild(o);
        });
        if (cur) sel.value = cur;
    }

    function createOrderItemHTML() {
        const productOptions = products
            .map(p => `<option value="${p._id}" data-price="${p.price}">${p.name} - ${formatCurrency(p.price)}</option>`)
            .join('');

        return `
            <div class="order-item">
                <select class="item-product" required onchange="onProductSelected(this)">
                    <option value="">Select Product</option>
                    ${productOptions}
                </select>
                <select class="item-variant" required onchange="calculateTotal()" style="display:none;">
                    <option value="">Select Variant</option>
                </select>
                <input type="number" class="item-quantity" min="1" placeholder="Qty" required onchange="calculateTotal()">
                <button type="button" class="btn btn-small" onclick="removeItem(this)">Remove</button>
            </div>
        `;
    }

    function addItem() {
        const container = document.getElementById('orderItems');
        if (!container) return;

        const item = document.createElement('div');
        item.className = 'order-item';
        item.innerHTML = createOrderItemHTML();
        container.appendChild(item);
    }

    function removeItem(btn) {
        const items = document.querySelectorAll('.order-item');
        if (items.length > 1) {
            btn.closest('.order-item').remove();
            calculateTotal();
        }
    }

    // ========== VARIANT SELECTION ==========
    function onProductSelected(selectElement) {
        const productId = selectElement.value;
        const orderItem = selectElement.closest('.order-item');
        const variantSelect = orderItem.querySelector('.item-variant');

        if (!productId) {
            variantSelect.style.display = 'none';
            variantSelect.innerHTML = '<option value="">Select Variant</option>';
            calculateTotal();
            return;
        }

        // Get variants for this product
        const productVariants = variants.filter(v => v.product === productId);

        if (productVariants.length === 0) {
            variantSelect.style.display = 'none';
            variantSelect.innerHTML = '<option value="">Select Variant</option>';
            calculateTotal();
            return;
        }

        // Populate variant dropdown
        variantSelect.style.display = 'block';
        variantSelect.innerHTML = '<option value="">Select Variant</option>';

        productVariants.forEach(variant => {
            const sizeName = variant.size?.name || 'any';
            const colorName = variant.color?.name || 'any';
            const label = `${variant.sku} - Size: ${sizeName}, Color: ${colorName}`;

            const option = document.createElement('option');
            option.value = variant._id;
            option.textContent = label;
            option.setAttribute('data-price', variant.price);
            variantSelect.appendChild(option);
        });

        calculateTotal();
    }

    function calculateTotal() {
        let total = 0;
        const items = document.querySelectorAll('.order-item');

        items.forEach(item => {
            const productSelect = item.querySelector('.item-product');
            const variantSelect = item.querySelector('.item-variant');
            const qty = parseInt(item.querySelector('.item-quantity').value) || 0;

            let price = 0;

            // Use variant price if selected
            if (variantSelect && variantSelect.style.display !== 'none' && variantSelect.value) {
                price = parseFloat(variantSelect.options[variantSelect.selectedIndex]?.getAttribute('data-price')) || 0;
            }
            // Otherwise use product price
            else if (productSelect.value) {
                price = parseFloat(productSelect.options[productSelect.selectedIndex]?.getAttribute('data-price')) || 0;
            }

            total += price * qty;
        });

        const totalElement = document.getElementById('totalAmount');
        if (totalElement) {
            totalElement.innerText = formatCurrency(total);
        }
    }

    // ========== API OPERATIONS ==========
    async function saveOrder(event) {
        event.preventDefault();
        const token = getToken();
        hideError('modalError');

        // Collect order items
        const items = [];
        document.querySelectorAll('.order-item').forEach(item => {
            const product = item.querySelector('.item-product').value;
            const variantSelect = item.querySelector('.item-variant');
            const variant = (variantSelect && variantSelect.style.display !== 'none') ? variantSelect.value : null;
            const quantity = parseInt(item.querySelector('.item-quantity').value);

            if (product && quantity > 0) {
                const itemObj = { product, quantity };
                if (variant) {
                    itemObj.variant = variant;
                }
                items.push(itemObj);
            }
        });

        if (items.length === 0) {
            showError('modalError', 'At least one item is required');
            return;
        }

        const customer = (document.getElementById('orderCustomer') && document.getElementById('orderCustomer').value) || '';
        if (!customer) {
            showError('modalError', 'Select a customer');
            return;
        }

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: token
                },
                body: JSON.stringify({ customer, items })
            });

            const data = await res.json();
            if (data.success) {
                closeOrderModal();
                loadOrders();
                adminApp?.showToast?.('Order created successfully');
            } else {
                showError('modalError', data.message || 'Error creating order');
            }
        } catch (err) {
            showError('modalError', `Network error: ${err.message}`);
        }
    }

    async function viewOrder(id) {
        const token = getToken();

        try {
            const res = await fetch(`/api/orders/${id}`, { headers: { authorization: token } });
            const data = await res.json();

            if (!data.success) {
                throw new Error(data.message || 'Order not found');
            }

            const order = data.order;
            let html = `
                <h3>Order Details</h3>
                <p><strong>Customer:</strong> ${order.customer?.name || 'Unknown'} (${order.customer?.email || 'N/A'})</p>
                <p><strong>Status:</strong> ${order.status || 'pending'}</p>
                <p><strong>Total:</strong> ${formatCurrency(order.totalAmount)}</p>
                <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
                <h4>Items:</h4>
                <ul>
            `;

            (order.items || []).forEach(item => {
                const productName = item.product?.name || 'Unknown';
                const variantInfo = item.variant ? ` (${item.variant.sku})` : '';
                const price = formatCurrency(item.price);
                html += `<li>${productName} - Qty: ${item.quantity} × ${price}${variantInfo}</li>`;
            });

            html += '</ul>';
            const contentEl = document.getElementById('orderDetailsContent');
            const modalEl = document.getElementById('orderDetailsModal');

            if (contentEl) contentEl.innerHTML = html;
            if (modalEl) {
                modalEl.classList.add('show');
                modalEl.style.display = 'flex';
            }
        } catch (err) {
            adminApp?.showToast?.(`Error viewing order: ${err.message}`, 'error');
        }
    }

    async function updateStatus(id, currentStatus) {
        const newStatus = prompt(`Enter new status (pending, confirmed, shipped, delivered, cancelled):`, currentStatus);
        if (!newStatus || newStatus === currentStatus) return;

        const token = getToken();

        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: token
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await res.json();
            if (data.success) {
                loadOrders();
                adminApp?.showToast?.('Order status updated');
            } else {
                adminApp?.showToast?.(`Error: ${data.message}`, 'error');
            }
        } catch (err) {
            adminApp?.showToast?.(`Error: ${err.message}`, 'error');
        }
    }

    async function deleteOrder(id) {
        if (!confirm('Are you sure you want to delete this order?')) return;

        const token = getToken();

        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: 'DELETE',
                headers: { authorization: token }
            });

            const data = await res.json();
            if (data.success) {
                loadOrders();
                adminApp?.showToast?.('Order deleted');
            } else {
                adminApp?.showToast?.(`Error: ${data.message}`, 'error');
            }
        } catch (err) {
            adminApp?.showToast?.(`Error: ${err.message}`, 'error');
        }
    }

    // ========== PAGE NAVIGATION ==========
    function goToPage(page) {
        currentPage = page;
        renderTable();
    }

    function filterOrders() {
        const query = document.getElementById('searchInput')?.value?.toLowerCase() || '';
        filteredOrders = allOrders.filter(o =>
            (o.customer?.name || '').toLowerCase().includes(query) ||
            (o.status || '').toLowerCase().includes(query)
        );
        currentPage = 1;
        renderTable();
    }

    // ========== INITIALIZATION ==========
    async function init() {
        await loadCustomersAndProducts();

        // Only initialize if we're on the order page
        if (!document.getElementById('results') || !document.getElementById('entriesPerPage')) {
            return;
        }

        loadOrders();

        // Expose functions to global scope
        window.openOrderModal = openOrderModal;
        window.closeOrderModal = closeOrderModal;
        window.closeOrderDetailsModal = closeOrderDetailsModal;
        window.saveOrder = saveOrder;
        window.viewOrder = viewOrder;
        window.updateStatus = updateStatus;
        window.deleteOrder = deleteOrder;
        window.addItem = addItem;
        window.removeItem = removeItem;
        window.calculateTotal = calculateTotal;
        window.onProductSelected = onProductSelected;
        window.goToPage = goToPage;
        window.filterOrders = filterOrders;

        // Attach event listeners
        const entriesSelect = document.getElementById('entriesPerPage');
        const searchInput = document.getElementById('searchInput');

        if (entriesSelect) {
            entriesSelect.addEventListener('change', () => {
                currentPage = 1;
                renderTable();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', filterOrders);
        }
    }

    return { init };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.orderModule?.init) {
        window.orderModule.init();
    }
});