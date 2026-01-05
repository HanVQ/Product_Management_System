// Product Type management scripts
window.brandModule = (function () {
    let allBrands = [];
    let filteredBrands = [];
    let currentPage = 1;
    let editingBrandID = null;

    function getToken() {
        return localStorage.getItem('token');
    }

    async function loadBrands() {
        const token = getToken();
        const out = document.getElementById('results');
        if (!token) { 
            out.innerText = 'No token available. Please login as admin.'; 
            return; 
        }
        const res = await fetch('/api/brands', { headers: { authorization: token } });
        const data = await res.json();
        if (!data.data) { 
            out.innerText = 'Error loading brands: ' + (data.message || JSON.stringify(data)); 
            return; 
        }
        allBrands = data.data || [];
        filteredBrands = [...allBrands];
        currentPage = 1;
        renderTable();
    }

    function renderTable() {
        const perPage = Math.max(1, parseInt(document.getElementById('entriesPerPage').value) || 10);
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        const pageData = filteredBrands.slice(start, end);

        let html = '<div class="table-responsive"><table><thead><tr><th style="width:50px">#</th><th>Name</th><th>Description</th><th style="width:140px">Action</th></tr></thead><tbody>';
        pageData.forEach((b, idx) => {
            html += `<tr>
        <td>${start + idx + 1}</td>
        <td>${b.name || ''}</td>
        <td>${(b.description || '').substring(0, 50)}${(b.description || '').length > 50 ? '...' : ''}</td>
        <td class="action"><div class="action-btns">
          <button class="btn btn-warning" onclick="editBrandModal('${b._id}', '${escapeHtml(b.name || '')}', '${escapeHtml(b.description || '')}')">Edit</button>
          <button class="btn btn-danger" onclick="deleteBrand('${b._id}')">Delete</button>
        </div></td>
      </tr>`;
        });
        html += '</tbody></table></div>';
        document.getElementById('results').innerHTML = html;
        renderPagination(perPage);
        document.getElementById('infoText').innerText = `Showing ${start + 1} to ${Math.min(end, filteredBrands.length)} of ${filteredBrands.length} entries (filtered from ${allBrands.length} total entries)`;
    }

    function renderPagination(perPage) {
        const totalPages = Math.max(1, Math.ceil(filteredBrands.length / perPage));
        const maxButtons = 7;
        let parts = [];

        function pushBtn(label, page, cls) {
            if (page === null) return;
            const c = cls ? cls : (page === currentPage ? 'btn active' : 'btn');
            parts.push(`<button class="${c}" onclick="goToPage(${page})">${label}</button>`);
        }

        if (currentPage > 1) { pushBtn('<<', 1, 'btn'); pushBtn('<', currentPage - 1, 'btn'); }

        if (totalPages <= maxButtons) {
            for (let i = 1; i <= totalPages; i++) pushBtn(i, i);
        } else {
            let startPage = Math.max(1, currentPage - 3);
            let endPage = Math.min(totalPages, startPage + maxButtons - 1);
            if (endPage - startPage < maxButtons - 1) startPage = Math.max(1, endPage - maxButtons + 1);
            for (let i = startPage; i <= endPage; i++) pushBtn(i, i);
        }

        if (currentPage < totalPages) { pushBtn('>', currentPage + 1, 'btn'); pushBtn('>>', totalPages, 'btn'); }

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

    function filterBrands() {
        const query = document.getElementById('searchInput').value.toLowerCase();
        filteredBrands = allBrands.filter(b => (b.name || '').toLowerCase().includes(query));
        currentPage = 1;
        renderTable();
    }

    function openAddModal() {
        editingBrandID = null;
        const modalTitle = document.getElementById('modalTitle');
        const brandName = document.getElementById('brandName');
        const brandDescription = document.getElementById('brandDescription');
        const modalError = document.getElementById('modalError');
        const brandModal = document.getElementById('brandModal');

        if (!modalTitle || !brandName || !brandDescription || !modalError || !brandModal) return;

        modalTitle.innerText = 'Add Brand';
        brandName.value = '';
        brandDescription.value = '';
        modalError.style.display = 'none';
        brandModal.classList.add('show');
    }

    function openEditModal(id, name, description) {
        editingBrandID = id;
        const modalTitle = document.getElementById('modalTitle');
        const brandName = document.getElementById('brandName');
        const brandDescription = document.getElementById('brandDescription');
        const modalError = document.getElementById('modalError');
        const brandModal = document.getElementById('brandModal');

        if (!modalTitle || !brandName || !brandDescription || !modalError || !brandModal) return;

        modalTitle.innerText = 'Edit Brand';
        brandName.value = name;
        brandDescription.value = description;
        modalError.style.display = 'none';
        brandModal.classList.add('show');
    }

    function closeModal() {
        const brandModal = document.getElementById('brandModal');
        if (brandModal) {
            brandModal.classList.remove('show');
        }
    }

    async function saveBrand(event) {
        event.preventDefault();
        const token = getToken();
        const name = document.getElementById('brandName').value.trim();
        const description = document.getElementById('brandDescription').value.trim();

        if (!name) {
            const modalError = document.getElementById('modalError');
            if (modalError) { modalError.style.display = 'block'; modalError.innerText = 'Name is required'; }
            return;
        }

        const method = editingBrandID ? 'PUT' : 'POST';
        const url = editingBrandID ? `/api/brands/${editingBrandID}` : '/api/brands';

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
            await loadBrands();
        } else {
            const modalError = document.getElementById('modalError');
            if (modalError) { modalError.style.display = 'block'; modalError.innerText = data.message || 'Error saving brand'; }
        }
    }

    async function deleteBrand(id) {
        if (!confirm('Are you sure you want to delete this brand?')) {
            return;
        }
        const token = getToken();
        const res = await fetch(`/api/brands/${id}`, {
            method: 'DELETE',
            headers: { authorization: token }
        });
        const data = await res.json();
        if (data.success) {
            await loadBrands();
        } else {
            alert(data.message || 'Error deleting brand');
        }
    }

    function escapeHtml(str) { 
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;'); 
    }

    function init() {
        loadBrands();
        // Attach functions to window for global access
        window.openBrandModal = openAddModal;
        window.editBrandModal = openEditModal;
        window.closeBrandModal = closeModal;
        window.saveBrand = saveBrand;
        window.deleteBrand = deleteBrand;
        window.changePage = changePage;
        window.goToPage = goToPage;
        const entries = document.getElementById('entriesPerPage');
        if (entries) entries.addEventListener('change', () => { currentPage = 1; renderTable(); });
        const search = document.getElementById('searchInput');
        if (search) search.addEventListener('input', filterBrands);
    }

    return { init };
})();
