// Inventory management scripts
window.inventoryModule = (function () {
    let allTransactions = [];
    let filteredTransactions = [];
    let currentPage = 1;
    let products = [];

    function getToken() {
        return localStorage.getItem('token');
    }

    async function loadTransactions() {
        const token = getToken();
        const out = document.getElementById('results');
        if (!token) { 
            out.innerText = 'No token available. Please login as admin.'; 
            return; 
        }
        const res = await fetch('/api/inventory', { headers: { authorization: token } });
        const data = await res.json();
        if (!data.success) { 
            out.innerText = 'Error loading transactions: ' + (data.message || JSON.stringify(data)); 
            return; 
        }
        allTransactions = data.transactions || [];
        filteredTransactions = [...allTransactions];
        currentPage = 1;
        renderTable();
    }

    async function loadProducts() {
        const token = getToken();
        const res = await fetch('/api/products', { headers: { authorization: token } });
        const data = await res.json();
        products = data.success ? data.products : [];
    }

    function renderTable() {
        const perPage = parseInt(document.getElementById('entriesPerPage').value);
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        const pageData = filteredTransactions.slice(start, end);

        let html = '<div class="table-responsive"><table><thead><tr><th style="width:50px">#</th><th>Product</th><th>Type</th><th>Quantity</th><th>Reason</th><th>Date</th><th style="width:140px">Action</th></tr></thead><tbody>';
        pageData.forEach((t, idx) => {
            html += `<tr>
        <td>${start + idx + 1}</td>
        <td>${t.product?.name || 'Unknown'}</td>
        <td><span class="type ${t.type}">${t.type}</span></td>
        <td>${t.quantity}</td>
        <td>${t.reason || ''}</td>
        <td>${new Date(t.transactionDate).toLocaleString('vi-VN')}</td>
        <td class="action"><div class="action-btns">
          <button class="btn btn-danger" onclick="deleteTransaction('${t._id}')">Delete</button>
        </div></td>
      </tr>`;
        });
        html += '</tbody></table></div>';
        document.getElementById('results').innerHTML = html;
        renderPagination(perPage);
        document.getElementById('infoText').innerText = `Showing ${start + 1} to ${Math.min(end, filteredTransactions.length)} of ${filteredTransactions.length} entries (filtered from ${allTransactions.length} total entries)`;
    }

    function renderPagination(perPage) {
        const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / perPage));
        const maxButtons = 7;
        let parts = [];

        function pushBtn(label, page, cls) {
            if (page === null) { parts.push(`<span class="ellipsis">${label}</span>`); return; }
            const c = cls ? cls : (page === currentPage ? 'btn active' : 'btn');
            parts.push(`<button class="${c}" onclick="goToPage(${page})">${label}</button>`);
        }

        if (currentPage > 1) { 
            pushBtn('<<', 1, 'btn'); 
            pushBtn('<', currentPage - 1, 'btn'); 
        } else { 
            pushBtn('<<', 1, 'btn'); 
            pushBtn('<', null, 'btn'); 
        }

        if (totalPages <= maxButtons) {
            for (let i = 1; i <= totalPages; i++) pushBtn(i, i);
        } else {
            const left = Math.max(2, currentPage - 2);
            const right = Math.min(totalPages - 1, currentPage + 2);

            pushBtn(1, 1);
            if (left > 2) {
                pushBtn('...', null);
            }
            for (let i = left; i <= right; i++) {
                pushBtn(i, i);
            }
            if (right < totalPages - 1) {
                pushBtn('...', null);
            }
            pushBtn(totalPages, totalPages);
        }

        if (currentPage < totalPages) { 
            pushBtn('>', currentPage + 1, 'btn'); pushBtn('>>', totalPages, 'btn'); 
        } else { pushBtn('>', null, 'btn'); pushBtn('>>', totalPages, 'btn'); 
            
        }

        document.getElementById('pagination').innerHTML = parts.join('');
    }

    function goToPage(page) { currentPage = page; renderTable(); }


    function changePage(page) {
        currentPage = page;
        renderTable();
    }

    function filterTransactions() {
        const query = document.getElementById('searchInput').value.toLowerCase();
        filteredTransactions = allTransactions.filter(t =>
            (t.product?.name || '').toLowerCase().includes(query) ||
            (t.type || '').toLowerCase().includes(query)
        );
        currentPage = 1;
        renderTable();
    }

    function openInventoryModal() {
        const modalTitle = document.getElementById('modalTitle');
        const transactionProduct = document.getElementById('transactionProduct');
        const transactionType = document.getElementById('transactionType');
        const transactionQuantity = document.getElementById('transactionQuantity');
        const transactionReason = document.getElementById('transactionReason');
        const modalError = document.getElementById('modalError');
        const inventoryModal = document.getElementById('inventoryModal');

        if (!modalTitle || !transactionProduct || !transactionType || !transactionQuantity || !transactionReason || !modalError || !inventoryModal) {
            console.error('Modal elements not found. Make sure you are on the Inventory page.');
            return;
        }

        populateProductSelect();
        modalTitle.innerText = 'Add Transaction';
        transactionProduct.value = '';
        transactionType.value = 'inbound';
        transactionQuantity.value = '';
        transactionReason.value = '';
        modalError.style.display = 'none';
        inventoryModal.classList.add('show');
    }

    function populateProductSelect() {
        const select = document.getElementById('transactionProduct');
        select.innerHTML = '<option value="">Select Product</option>';
        products.forEach(p => {
            select.innerHTML += `<option value="${p._id}">${p.name} (Stock: ${p.stock})</option>`;
        });
    }

    function closeInventoryModal() {
        const inventoryModal = document.getElementById('inventoryModal');
        if (inventoryModal) {
            inventoryModal.classList.remove('show');
        }
    }

    async function saveTransaction(event) {
        event.preventDefault();
        const token = getToken();
        const product = document.getElementById('transactionProduct').value;
        const type = document.getElementById('transactionType').value;
        const quantity = parseInt(document.getElementById('transactionQuantity').value);
        const reason = document.getElementById('transactionReason').value.trim();

        if (!product || !type || !quantity || quantity <= 0) {
            document.getElementById('modalError').innerText = 'All fields are required with valid quantity';
            document.getElementById('modalError').style.display = 'block';
            return;
        }

        const res = await fetch('/api/inventory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                authorization: token
            },
            body: JSON.stringify({ product, type, quantity, reason })
        });
        const data = await res.json();
        if (data.success) {
            closeInventoryModal();
            loadTransactions();
            adminApp.showToast('Transaction added');
        } else {
            document.getElementById('modalError').innerText = data.message || 'Error saving transaction';
            document.getElementById('modalError').style.display = 'block';
        }
    }

    async function deleteTransaction(id) {
        if (!confirm('Are you sure you want to delete this transaction? Stock will be adjusted.')) return;
        const token = getToken();
        const res = await fetch(`/api/inventory/${id}`, {
            method: 'DELETE',
            headers: { authorization: token }
        });
        const data = await res.json();
        if (data.success) {
            loadTransactions();
            adminApp.showToast('Transaction deleted');
        } else {
            adminApp.showToast('Error deleting transaction: ' + data.message, 'error');
        }
    }

    function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;'); }

    async function init() {
        await loadProducts();
        loadTransactions();
        // Attach functions to window for global access
        window.openInventoryModal = openInventoryModal;
        window.closeInventoryModal = closeInventoryModal;
        window.saveTransaction = saveTransaction;
        window.deleteTransaction = deleteTransaction;
        window.changePage = changePage;
        window.goToPage = goToPage;
        document.getElementById('entriesPerPage').addEventListener('change', () => { currentPage = 1; renderTable(); });
        document.getElementById('searchInput').addEventListener('input', filterTransactions);
    }

    return { init };
})();