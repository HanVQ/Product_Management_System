// Product Type management scripts
window.productTypeModule = (function () {
    let allProductTypes = [];
    let filteredProductTypes = [];
    let currentPage = 1;
    let editingProductTypeId = null;

    function getToken() {
        return localStorage.getItem('token');
    }

    async function loadProductTypes() {
        const token = getToken();
        const out = document.getElementById('results');
        if (!token) {
            out.innerText = 'No token available. Please login as admin.';
            return;
        }
        const res = await fetch('/api/producttypes', { headers: { authorization: token } });
        const data = await res.json();
        if (!data.data) {
            out.innerText = 'Error loading product types: ' + (data.message || JSON.stringify(data));
            return;
        }
        allProductTypes = data.data || [];
        filteredProductTypes = [...allProductTypes];
        currentPage = 1;
        renderTable();
    }

    function renderTable() {
        const perPage = Math.max(1, parseInt(document.getElementById('entriesPerPage').value) || 10);
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        const pageData = filteredProductTypes.slice(start, end);

        let html = '<div class="table-responsive"><table><thead><tr><th style="width:50px">#</th><th>Name</th><th>Description</th><th style="width:140px">Action</th></tr></thead><tbody>';
        pageData.forEach((pt, idx) => {
            html += `<tr>
        <td>${start + idx + 1}</td>
        <td>${pt.name || ''}</td>
        <td>${(pt.description || '').substring(0, 50)}${(pt.description || '').length > 50 ? '...' : ''}</td>
        <td class="action"><div class="action-btns">
          <button class="btn btn-warning" onclick="editProductTypeModal('${pt._id}', '${escapeHtml(pt.name || '')}', '${escapeHtml(pt.description || '')}')">Edit</button>
          <button class="btn btn-danger" onclick="deleteProductType('${pt._id}')">Delete</button>
        </div></td>
      </tr>`;
        });
        html += '</tbody></table></div>';
        document.getElementById('results').innerHTML = html;
        renderPagination(perPage);
        document.getElementById('infoText').innerText = `Showing ${start + 1} to ${Math.min(end, filteredProductTypes.length)} of ${filteredProductTypes.length} entries (filtered from ${allProductTypes.length} total entries)`;
    }

    function renderPagination(perPage) {
        const totalPages = Math.max(1, Math.ceil(filteredProductTypes.length / perPage));
        const maxButtons = 7;
        let parts = [];

        function pushBtn(label, page, cls) {
            if (page === null) {
                parts.push(`<span class="ellipsis">${label}</span>`);
                return;
            }
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
            pushBtn('>', currentPage + 1, 'btn');
            pushBtn('>>', totalPages, 'btn');
        } else {
            pushBtn('>', null, 'btn');
            pushBtn('>>', totalPages, 'btn');
        }

        document.getElementById('pagination').innerHTML = parts.join('');
    }

    function goToPage(page) {
        currentPage = page;
        renderTable();
    }

    function changePage(page) {
        currentPage = page;
        renderTable();
    }

    function filterProductTypes() {
        const query = document.getElementById('searchInput').value.toLowerCase();
        filteredProductTypes = allProductTypes.filter(pt =>
            (pt.name || '').toLowerCase().includes(query)
        );
        currentPage = 1;
        renderTable();
    }

    function openAddModal() {
        editingProductTypeId = null;
        const modalTitle = document.getElementById('modalTitle');
        const productTypeName = document.getElementById('productTypeName');
        const productTypeDescription = document.getElementById('productTypeDescription');
        const modalError = document.getElementById('modalError');
        const productTypeModal = document.getElementById('productTypeModal');

        if (!modalTitle || !productTypeName || !productTypeDescription || !modalError || !productTypeModal) {
            console.error('Modal elements not found. Make sure you are on the Product Types page.');
            return;
        }

        modalTitle.innerText = 'Add Product Type';
        productTypeName.value = '';
        productTypeDescription.value = '';
        modalError.style.display = 'none';
        productTypeModal.classList.add('show');
    }

    function openEditModal(id, name, description) {
        editingProductTypeId = id;
        const modalTitle = document.getElementById('modalTitle');
        const productTypeName = document.getElementById('productTypeName');
        const productTypeDescription = document.getElementById('productTypeDescription');
        const modalError = document.getElementById('modalError');
        const productTypeModal = document.getElementById('productTypeModal');

        if (!modalTitle || !productTypeName || !productTypeDescription || !modalError || !productTypeModal) {
            console.error('Modal elements not found. Make sure you are on the Product Types page.');
            return;
        }

        modalTitle.innerText = 'Edit Product Type';
        productTypeName.value = name;
        productTypeDescription.value = description;
        modalError.style.display = 'none';
        productTypeModal.classList.add('show');
    }

    function closeModal() {
        const productTypeModal = document.getElementById('productTypeModal');
        if (productTypeModal) {
            productTypeModal.classList.remove('show');
        }
    }

    async function saveProductType(event) {
        event.preventDefault();
        const token = getToken();
        const name = document.getElementById('productTypeName').value.trim();
        const description = document.getElementById('productTypeDescription').value.trim();

        if (!name) {
            document.getElementById('modalError').innerText = 'Name is required';
            document.getElementById('modalError').style.display = 'block';
            return;
        }

        const method = editingProductTypeId ? 'PUT' : 'POST';
        const url = editingProductTypeId ? `/api/producttypes/${editingProductTypeId}` : '/api/producttypes';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                authorization: token
            },
            body: JSON.stringify({ name, description })
        });
        const data = await res.json();
        if (data.success) {
            closeModal();
            loadProductTypes();
            adminApp.showToast(editingProductTypeId ? 'Product Type updated' : 'Product Type added');
        } else {
            document.getElementById('modalError').innerText = data.message || 'Error saving product type';
            document.getElementById('modalError').style.display = 'block';
        }
    }

    async function deleteProductType(id) {
        if (!confirm('Are you sure you want to delete this product type?')) return;
        const token = getToken();
        const res = await fetch(`/api/producttypes/${id}`, {
            method: 'DELETE',
            headers: { authorization: token }
        });
        const data = await res.json();
        if (data.success) {
            loadProductTypes();
            adminApp.showToast('Product Type deleted');
        } else {
            adminApp.showToast('Error deleting product type: ' + data.message, 'error');
        }
    }

    function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;'); }

    function init() {
        loadProductTypes();
        // Attach functions to window for global access
        window.openProductTypeModal = openAddModal;
        window.editProductTypeModal = openEditModal;
        window.closeProductTypeModal = closeModal;
        window.saveProductType = saveProductType;
        window.deleteProductType = deleteProductType;
        window.changePage = changePage;
        window.goToPage = goToPage;
        document.getElementById('entriesPerPage').addEventListener('change', () => { currentPage = 1; renderTable(); });
        document.getElementById('searchInput').addEventListener('input', filterProductTypes);
    }

    return { init };
})();
