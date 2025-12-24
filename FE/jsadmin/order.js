// Order management scripts
window.orderModule = (function () {
    let allOrders = [];
    let filteredOrders = [];
    let currentPage = 1;
    let customers = [];
    let products = [];

    function getToken() {
        return localStorage.getItem('token');
    }

    async function loadOrders() {
        const token = getToken();
        const out = document.getElementById('results');
        if (!token) { out.innerText = 'No token available. Please login as admin.'; return; }
        const res = await fetch('/api/orders', { headers: { authorization: token } });
        const data = await res.json();
        if (!data.success) { out.innerText = 'Error loading orders: ' + (data.message || JSON.stringify(data)); return; }
        allOrders = data.orders || [];
        filteredOrders = [...allOrders];
        currentPage = 1;
        renderTable();
    }

    async function loadCustomersAndProducts() {
        const token = getToken();
        const [custRes, prodRes] = await Promise.all([
            fetch('/api/customers', { headers: { authorization: token } }),
            fetch('/api/products', { headers: { authorization: token } })
        ]);
        const custData = await custRes.json();
        const prodData = await prodRes.json();
        customers = custData.success ? custData.customers : [];
        products = prodData.success ? prodData.products : [];
    }

    function renderTable() {
        const perPage = parseInt(document.getElementById('entriesPerPage').value);
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        const pageData = filteredOrders.slice(start, end);

        let html = '<div class="table-responsive"><table><thead><tr><th style="width:50px">#</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th style="width:250px">Action</th></tr></thead><tbody>';
        pageData.forEach((o, idx) => {
            const customerName = o.customer?.name || 'Unknown';
            const itemsCount = o.items?.length || 0;
            html += `<tr>
        <td>${start + idx + 1}</td>
        <td>${customerName}</td>
        <td>${itemsCount} item(s)</td>
        <td>${Number(o.totalAmount || 0).toLocaleString('vi-VN')} ₫</td>
        <td><span class="status ${o.status}">${o.status}</span></td>
        <td>${new Date(o.createdAt).toLocaleString('vi-VN')}</td>
        <td class="action"><div class="action-btns">
          <button class="btn btn-info" onclick="viewOrder('${o._id}')">View</button>
          <button class="btn btn-warning" onclick="updateStatus('${o._id}', '${o.status}')">Update Status</button>
          <button class="btn btn-danger" onclick="deleteOrder('${o._id}')">Delete</button>
        </div></td>
      </tr>`;
        });
        html += '</tbody></table></div>';
        document.getElementById('results').innerHTML = html;
        renderPagination(perPage);
        document.getElementById('infoText').innerText = `Showing ${start + 1} to ${Math.min(end, filteredOrders.length)} of ${filteredOrders.length} entries (filtered from ${allOrders.length} total entries)`;
    }

    function renderPagination(perPage) {
        const totalPages = Math.max(1, Math.ceil(filteredOrders.length / perPage));
        const maxButtons = 7;
        let parts = [];

        function pushBtn(label, page, cls) {
            if (page === null) { parts.push(`<span class="ellipsis">${label}</span>`); return; }
            const c = cls ? cls : (page === currentPage ? 'btn active' : 'btn');
            parts.push(`<button class="${c}" onclick="goToPage(${page})">${label}</button>`);
        }

        if (currentPage > 1) { pushBtn('<<', 1, 'btn'); pushBtn('<', currentPage - 1, 'btn'); }
        else { pushBtn('<<', 1, 'btn'); pushBtn('<', null, 'btn'); }

        if (totalPages <= maxButtons) {
            for (let i = 1; i <= totalPages; i++) pushBtn(i, i);
        } else {
            const left = Math.max(2, currentPage - 2);
            const right = Math.min(totalPages - 1, currentPage + 2);

            pushBtn(1, 1);
            if (left > 2) pushBtn('...', null);
            for (let i = left; i <= right; i++) pushBtn(i, i);
            if (right < totalPages - 1) pushBtn('...', null);
            pushBtn(totalPages, totalPages);
        }

        if (currentPage < totalPages) { pushBtn('>', currentPage + 1, 'btn'); pushBtn('>>', totalPages, 'btn'); }
        else { pushBtn('>', null, 'btn'); pushBtn('>>', totalPages, 'btn'); }

        document.getElementById('pagination').innerHTML = parts.join('');
    }

    function goToPage(page) { currentPage = page; renderTable(); }

    function changePage(page) {
        currentPage = page;
        renderTable();
    }

    function filterOrders() {
        const query = document.getElementById('searchInput').value.toLowerCase();
        filteredOrders = allOrders.filter(o =>
            (o.customer?.name || '').toLowerCase().includes(query) ||
            (o.status || '').toLowerCase().includes(query)
        );
        currentPage = 1;
        renderTable();
    }

    function openOrderModal() {
        const modalTitle = document.getElementById('modalTitle');
        const totalAmount = document.getElementById('totalAmount');
        const modalError = document.getElementById('modalError');
        const orderModal = document.getElementById('orderModal');

        if (!modalTitle || !totalAmount || !modalError || !orderModal) {
            console.error('Modal elements not found. Make sure you are on the Orders page.');
            return;
        }

        modalTitle.innerText = 'Create Order';
        populateCustomerSelect();
        populateProductSelects();
        totalAmount.innerText = '0.00';
        modalError.style.display = 'none';
        orderModal.classList.add('show');
    }

    function populateCustomerSelect() {
        const select = document.getElementById('orderCustomer');
        select.innerHTML = '<option value="">Select Customer</option>';
        customers.forEach(c => {
            select.innerHTML += `<option value="${c._id}">${c.name} (${c.email})</option>`;
        });
    }

    function populateProductSelects() {
        const container = document.getElementById('orderItems');
        container.innerHTML = `
      <div class="order-item">
        <select class="item-product" required onchange="calculateTotal()">
          <option value="">Select Product</option>
          ${products.map(p => `<option value="${p._id}" data-price="${p.price}">${p.name} - ${Number(p.price).toLocaleString('vi-VN')} ₫</option>`).join('')}
        </select>
        <input type="number" class="item-quantity" min="1" placeholder="Qty" required onchange="calculateTotal()">
        <button type="button" class="btn btn-small" onclick="removeItem(this)">Remove</button>
      </div>
    `;
    }

    function addItem() {
        const container = document.getElementById('orderItems');
        const item = document.createElement('div');
        item.className = 'order-item';
        item.innerHTML = `
      <select class="item-product" required onchange="calculateTotal()">
        <option value="">Select Product</option>
        ${products.map(p => `<option value="${p._id}" data-price="${p.price}">${p.name} - ${Number(p.price).toLocaleString('vi-VN')} ₫</option>`).join('')}
      </select>
      <input type="number" class="item-quantity" min="1" placeholder="Qty" required onchange="calculateTotal()">
      <button type="button" class="btn btn-small" onclick="removeItem(this)">Remove</button>
    `;
        container.appendChild(item);
    }

    function removeItem(btn) {
        const items = document.querySelectorAll('.order-item');
        if (items.length > 1) {
            btn.closest('.order-item').remove();
            calculateTotal();
        }
    }

    function calculateTotal() {
        let total = 0;
        const items = document.querySelectorAll('.order-item');
        items.forEach(item => {
            const select = item.querySelector('.item-product');
            const qty = parseInt(item.querySelector('.item-quantity').value) || 0;
            const price = parseFloat(select.options[select.selectedIndex]?.getAttribute('data-price')) || 0;
            total += price * qty;
        });
        document.getElementById('totalAmount').innerText = Number(total).toLocaleString('vi-VN') + ' ₫';
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
            document.getElementById('orderDetailsModal').classList.remove('show');
            document.getElementById('orderDetailsModal').style.display = 'none';
            document.getElementById('orderDetailsContent').innerHTML = '';
        }
    }

    async function saveOrder(event) {
        event.preventDefault();
        const token = getToken();
        const customer = document.getElementById('orderCustomer').value;
        const items = [];

        document.querySelectorAll('.order-item').forEach(item => {
            const product = item.querySelector('.item-product').value;
            const quantity = parseInt(item.querySelector('.item-quantity').value);
            if (product && quantity > 0) {
                items.push({ product, quantity });
            }
        });

        if (!customer || items.length === 0) {
            document.getElementById('modalError').innerText = 'Customer and at least one item are required';
            document.getElementById('modalError').style.display = 'block';
            return;
        }

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
            adminApp.showToast('Order created');
        } else {
            document.getElementById('modalError').innerText = data.message || 'Error creating order';
            document.getElementById('modalError').style.display = 'block';
        }
    }

    async function viewOrder(id) {
        const token = getToken();
        const res = await fetch(`/api/orders/${id}`, { headers: { authorization: token } });
        const data = await res.json();
        if (data.success) {
            const order = data.order;
            let html = `
        <h3>Order Details</h3>
        <p><strong>Customer:</strong> ${order.customer.name} (${order.customer.email})</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Total:</strong> ${Number(order.totalAmount).toLocaleString('vi-VN')} ₫</p>
        <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
        <h4>Items:</h4>
        <ul>
      `;
            order.items.forEach(item => {
                html += `<li>${item.product.name} - Qty: ${item.quantity} - ${Number(item.price).toLocaleString('vi-VN')} ₫ mỗi cái</li>`;
            });
            html += '</ul>';
            document.getElementById('orderDetailsContent').innerHTML = html;
            document.getElementById('orderDetailsModal').classList.add('show');
            document.getElementById('orderDetailsModal').style.display = 'flex';
        }
    }

    async function updateStatus(id, currentStatus) {
        const newStatus = prompt('Enter new status (pending, confirmed, shipped, delivered, cancelled):', currentStatus);
        if (!newStatus || newStatus === currentStatus) return;
        const token = getToken();
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
            adminApp.showToast('Order status updated');
        } else {
            adminApp.showToast('Error updating status: ' + data.message, 'error');
        }
    }

    async function deleteOrder(id) {
        if (!confirm('Are you sure you want to delete this order?')) return;
        const token = getToken();
        const res = await fetch(`/api/orders/${id}`, {
            method: 'DELETE',
            headers: { authorization: token }
        });
        const data = await res.json();
        if (data.success) {
            loadOrders();
            adminApp.showToast('Order deleted');
        } else {
            adminApp.showToast('Error deleting order: ' + data.message, 'error');
        }
    }

    function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;'); }

    async function init() {
        await loadCustomersAndProducts();
        loadOrders();
        // Attach functions to window for global access
        window.openOrderModal = openOrderModal;
        window.closeOrderModal = closeOrderModal;
        window.closeOrderDetailsModal = closeOrderDetailsModal;
        window.saveOrder = saveOrder;
        window.viewOrder = viewOrder;
        window.updateStatus = updateStatus;
        window.deleteOrder = deleteOrder;
        window.changePage = changePage;
        window.addItem = addItem;
        window.removeItem = removeItem;
        window.calculateTotal = calculateTotal;
        window.goToPage = goToPage;
        document.getElementById('entriesPerPage').addEventListener('change', () => { currentPage = 1; renderTable(); });
        document.getElementById('searchInput').addEventListener('input', filterOrders);
    }

    return { init };
})();