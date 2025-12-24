// Customer management scripts
window.customerModule = (function () {
    let allCustomers = [];
    let filteredCustomers = [];
    let currentPage = 1;
    let editingCustomerId = null;

    function getToken() {
        return localStorage.getItem('token');
    }

    async function loadCustomers() {
        const token = getToken();
        const out = document.getElementById('results');
        if (!token) { out.innerText = 'No token available. Please login as admin.'; return; }
        const res = await fetch('/api/customers', { headers: { authorization: token } });
        const data = await res.json();
        if (!data.success) { out.innerText = 'Error loading customers: ' + (data.message || JSON.stringify(data)); return; }
        allCustomers = data.customers || [];
        filteredCustomers = [...allCustomers];
        currentPage = 1;
        renderTable();
    }

    function renderTable() {
        const perPage = parseInt(document.getElementById('entriesPerPage').value);
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        const pageData = filteredCustomers.slice(start, end);

        let html = '<div class="table-responsive"><table><thead><tr><th style="width:50px">#</th><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th style="width:140px">Action</th></tr></thead><tbody>';
        pageData.forEach((c, idx) => {
            html += `<tr>
        <td>${start + idx + 1}</td>
        <td>${c.name || ''}</td>
        <td>${c.email || ''}</td>
        <td>${c.phone || ''}</td>
        <td>${c.address || ''}</td>
        <td class="action"><div class="action-btns">
          <button class="btn btn-warning" onclick="editCustomerModal('${c._id}', '${escapeHtml(c.name || '')}', '${escapeHtml(c.email || '')}', '${escapeHtml(c.phone || '')}', '${escapeHtml(c.address || '')}')">Edit</button>
          <button class="btn btn-danger" onclick="deleteCustomer('${c._id}')">Delete</button>
        </div></td>
      </tr>`;
        });
        html += '</tbody></table></div>';
        document.getElementById('results').innerHTML = html;
        renderPagination(perPage);
        document.getElementById('infoText').innerText = `Showing ${start + 1} to ${Math.min(end, filteredCustomers.length)} of ${filteredCustomers.length} entries (filtered from ${allCustomers.length} total entries)`;
    }

    function renderPagination(perPage) {
        const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / perPage));
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

    function filterCustomers() {
        const query = document.getElementById('searchInput').value.toLowerCase();
        filteredCustomers = allCustomers.filter(c =>
            (c.name || '').toLowerCase().includes(query) ||
            (c.email || '').toLowerCase().includes(query)
        );
        currentPage = 1;
        renderTable();
    }

    function openAddModal() {
        editingCustomerId = null;
        const modalTitle = document.getElementById('modalTitle');
        const customerName = document.getElementById('customerName');
        const customerEmail = document.getElementById('customerEmail');
        const customerPhone = document.getElementById('customerPhone');
        const customerAddress = document.getElementById('customerAddress');
        const modalError = document.getElementById('modalError');
        const customerModal = document.getElementById('customerModal');

        if (!modalTitle || !customerName || !customerEmail || !customerPhone || !customerAddress || !modalError || !customerModal) {
            console.error('Modal elements not found. Make sure you are on the Customers page.');
            return;
        }

        modalTitle.innerText = 'Add Customer';
        customerName.value = '';
        customerEmail.value = '';
        customerPhone.value = '';
        customerAddress.value = '';
        modalError.style.display = 'none';
        customerModal.classList.add('show');
    }

    function openEditModal(id, name, email, phone, address) {
        editingCustomerId = id;
        const modalTitle = document.getElementById('modalTitle');
        const customerName = document.getElementById('customerName');
        const customerEmail = document.getElementById('customerEmail');
        const customerPhone = document.getElementById('customerPhone');
        const customerAddress = document.getElementById('customerAddress');
        const modalError = document.getElementById('modalError');
        const customerModal = document.getElementById('customerModal');

        if (!modalTitle || !customerName || !customerEmail || !customerPhone || !customerAddress || !modalError || !customerModal) {
            console.error('Modal elements not found. Make sure you are on the Customers page.');
            return;
        }

        modalTitle.innerText = 'Edit Customer';
        customerName.value = name;
        customerEmail.value = email;
        customerPhone.value = phone;
        customerAddress.value = address;
        modalError.style.display = 'none';
        customerModal.classList.add('show');
    }

    function closeModal() {
        const customerModal = document.getElementById('customerModal');
        if (customerModal) {
            customerModal.classList.remove('show');
        }
    }

    async function saveCustomer(event) {
        event.preventDefault();
        const token = getToken();
        const name = document.getElementById('customerName').value.trim();
        const email = document.getElementById('customerEmail').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const address = document.getElementById('customerAddress').value.trim();

        if (!name || !email) {
            document.getElementById('modalError').innerText = 'Name and email are required';
            document.getElementById('modalError').style.display = 'block';
            return;
        }

        const method = editingCustomerId ? 'PUT' : 'POST';
        const url = editingCustomerId ? `/api/customers/${editingCustomerId}` : '/api/customers';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                authorization: token
            },
            body: JSON.stringify({ name, email, phone, address })
        });
        const data = await res.json();
        if (data.success) {
            closeModal();
            loadCustomers();
            adminApp.showToast(editingCustomerId ? 'Customer updated' : 'Customer added');
        } else {
            document.getElementById('modalError').innerText = data.message || 'Error saving customer';
            document.getElementById('modalError').style.display = 'block';
        }
    }

    async function deleteCustomer(id) {
        if (!confirm('Are you sure you want to delete this customer?')) return;
        const token = getToken();
        const res = await fetch(`/api/customers/${id}`, {
            method: 'DELETE',
            headers: { authorization: token }
        });
        const data = await res.json();
        if (data.success) {
            loadCustomers();
            adminApp.showToast('Customer deleted');
        } else {
            adminApp.showToast('Error deleting customer: ' + data.message, 'error');
        }
    }

    function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;'); }

    function init() {
        loadCustomers();
        window.openCustomerModal = openAddModal;
        window.editCustomerModal = openEditModal;
        window.closeCustomerModal = closeModal;
        window.saveCustomer = saveCustomer;
        window.deleteCustomer = deleteCustomer;
        window.changePage = changePage;
        window.goToPage = goToPage;
        document.getElementById('entriesPerPage').addEventListener('change', () => { currentPage = 1; renderTable(); });
        document.getElementById('searchInput').addEventListener('input', filterCustomers);
    }
    // Attach functions to window for global access

    return { init };
})();