// Product management scripts
window.productModule = (function () {
    let allProducts = [];
    let filteredProducts = [];
        let allProductTypes = [];
        let allBrands = [];
    let currentPage = 1;
    let editingProductId = null;
    let currentSortField = '';
    let currentSortOrder = 'asc';

    function getToken() {
        return localStorage.getItem('token');
    }

    async function loadProductTypes() {
        const token = getToken();
        try {
            const res = await fetch('/api/producttypes', { headers: { authorization: token } });
            const data = await res.json();
            allProductTypes = data.data || [];
            populateProductTypeDropdown();
        } catch (error) {
            console.error('Error loading product types:', error);
        }
    }

    async function loadBrands() {
        const token = getToken();
        try {
            const res = await fetch('/api/brands', { headers: { authorization: token } });
            const data = await res.json();
            allBrands = data.data || [];
            populateBrandDropdown();
        } catch (error) {
            console.error('Error loading brands:', error);
        }
    }

    function populateProductTypeDropdown() {
        const select = document.getElementById('productCategory');
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select a product type</option>';
        allProductTypes.forEach(pt => {
            const option = document.createElement('option');
            option.value = pt._id;
            option.textContent = pt.name;
            select.appendChild(option);
        });
        
        if (currentValue) {
            select.value = currentValue;
        }
        // also populate filter select if present
        const filterSelect = document.getElementById('filterProductType');
        if (filterSelect) {
            const cur = filterSelect.value;
            // clear but keep the default 'All'
            filterSelect.innerHTML = '<option value="">All</option>';
            allProductTypes.forEach(pt => {
                const option = document.createElement('option');
                option.value = pt._id;
                option.textContent = pt.name;
                filterSelect.appendChild(option);
            });
            if (cur) filterSelect.value = cur;
        }
    }

    function populateBrandDropdown() {
        const select = document.getElementById('productBrand');
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = '<option value="">Select a brand</option>';
        allBrands.forEach(b => {
            const option = document.createElement('option');
            option.value = b._id;
            option.textContent = b.name;
            select.appendChild(option);
        });

        if (currentValue) select.value = currentValue;
        // also populate filter brand select
        const filterBrand = document.getElementById('filterBrand');
        if (filterBrand) {
            const cur = filterBrand.value;
            filterBrand.innerHTML = '<option value="">All</option>';
            allBrands.forEach(b => {
                const option = document.createElement('option');
                option.value = b._id;
                option.textContent = b.name;
                filterBrand.appendChild(option);
            });
            if (cur) filterBrand.value = cur;
        }
    }

    async function loadProducts() {
        const token = getToken();
        const out = document.getElementById('results');
        if (!token) { out.innerText = 'No token available. Please login as admin.'; return; }
        const res = await fetch('/api/products', { headers: { authorization: token } });
        const data = await res.json();
        if (!data.success) { out.innerText = 'Error loading products: ' + (data.message || JSON.stringify(data)); return; }
        allProducts = data.products || [];
        // attach product type, brand name, and stock status for easier rendering and filtering
        allProducts.forEach(p => {
            const pt = allProductTypes.find(t => String(t._id) === String(p.productType));
            p._productTypeName = pt ? pt.name : '';
            const b = allBrands.find(x => String(x._id) === String(p.brand || p.brandId || ''));
            p._brandName = b ? b.name : '';
            // compute stock status locally if backend doesn't provide it
            p._stockStatus = p.stockStatus || computeStockStatus(p.stock);
        });
        filteredProducts = [...allProducts];
        currentPage = 1;
        renderTable();
    }

    function renderTable() {
        const perPage = Math.max(1, parseInt(document.getElementById('entriesPerPage').value) || 10);
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        // apply sorting before paginating
        sortProducts(filteredProducts);
        const pageData = filteredProducts.slice(start, end);

                let html = '<div class="table-responsive"><table><thead><tr><th style="width:50px">#</th><th>Name</th><th>Description</th><th>Price</th><th>Stock</th><th>Stock Status</th><th>Brand</th><th>Product Type</th><th style="width:140px">Action</th></tr></thead><tbody>';
                                pageData.forEach((p, idx) => {
                                                const productTypeName = p._productTypeName || (allProductTypes.find(pt => String(pt._id) === String(p.productType)) || {}).name || '';
                                                const brandName = p._brandName || (allBrands.find(br => String(br._id) === String(p.brand || p.brandId || '')) || {}).name || '';
                                                const stockStatus = p._stockStatus || computeStockStatus(p.stock);
                                                const statusClass = stockStatus.replace(/\s+/g, '-');
                        html += `<tr>
                <td>${start + idx + 1}</td>
                <td>${p.name || ''}</td>
                <td>${(p.description || '').substring(0, 50)}${(p.description || '').length > 50 ? '...' : ''}</td>
                <td>${p.price.toLocaleString('vi-VN')} ₫</td>
                <td>${p.stock || 0}</td>
                <td><span class="badge status-${statusClass}">${stockStatus}</span></td>
                <td>${brandName}</td>
                <td>${productTypeName}</td>
                <td class="action"><div class="action-btns">
                                        <button class="btn btn-warning" onclick="editProductModal('${p._id}', '${escapeHtml(p.name || '')}', '${escapeHtml(p.description || '')}', '${p.price || 0}', '${p.stock || 0}', '${p.productType || ''}', '${p.brand || p.brandId || ''}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteProduct('${p._id}')">Delete</button>
                </div></td>
            </tr>`;
                });
        html += '</tbody></table></div>';
        document.getElementById('results').innerHTML = html;
        renderPagination(perPage);
        document.getElementById('infoText').innerText = `Showing ${start + 1} to ${Math.min(end, filteredProducts.length)} of ${filteredProducts.length} entries (filtered from ${allProducts.length} total entries)`;
    }

    function sortProducts(arr) {
        if (!currentSortField) return;
        const field = currentSortField;
        const dir = currentSortOrder === 'desc' ? -1 : 1;

        arr.sort((a, b) => {
            let va = a[field];
            let vb = b[field];

            // map brand/ productType fields to their display names
            if (field === 'brand') {
                va = a._brandName || '';
                vb = b._brandName || '';
            }
            if (field === 'name') {
                va = (a.name || '').toString();
                vb = (b.name || '').toString();
            }
            if (field === 'price' || field === 'stock') {
                va = Number(va || 0);
                vb = Number(vb || 0);
            }

            // compare
            if (typeof va === 'string' && typeof vb === 'string') {
                return va.localeCompare(vb, undefined, { numeric: true }) * dir;
            }
            if (typeof va === 'number' && typeof vb === 'number') {
                return (va - vb) * dir;
            }
            // fallback
            return String(va).localeCompare(String(vb)) * dir;
        });
    }

    function renderPagination(perPage) {
        const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
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

    function filterProducts() {
        const query = document.getElementById('searchInput').value.toLowerCase();
        const filterType = (document.getElementById('filterProductType') && document.getElementById('filterProductType').value) || '';
        const filterBrand = (document.getElementById('filterBrand') && document.getElementById('filterBrand').value) || '';
        const filterStock = (document.getElementById('filterStockStatus') && document.getElementById('filterStockStatus').value) || '';

        filteredProducts = allProducts.filter(p => {
            const matchesQuery = (p.name || '').toLowerCase().includes(query) || (p._brandName || '').toLowerCase().includes(query);
            if (!matchesQuery) return false;
            if (filterType && String(p.productType) !== String(filterType)) return false;
            if (filterBrand && String(p.brand || p.brandId || '') !== String(filterBrand)) return false;
            if (filterStock) {
                const status = (p._stockStatus || computeStockStatus(p.stock)).toLowerCase();
                if (status !== filterStock.toLowerCase()) return false;
            }
            return true;
        });
        currentPage = 1;
        renderTable();
    }

    function toggleSortPanel() {
        const panel = document.getElementById('sortPanel');
        if (!panel) return;
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    function applySort() {
        const opt = document.getElementById('sortOption');
        if (!opt) return;
        const val = opt.value || '';
        const parts = val.split(':');
        currentSortField = parts[0] || '';
        currentSortOrder = parts[1] || 'asc';
        renderTable();
        // hide panel after applying
        const panel = document.getElementById('sortPanel'); if (panel) panel.style.display = 'none';
    }

    function clearSort() {
        currentSortField = '';
        currentSortOrder = 'asc';
        const opt = document.getElementById('sortOption'); if (opt) opt.value = 'name:asc';
        renderTable();
    }

    function toggleFilterPanel() {
        const panel = document.getElementById('filterPanel');
        if (!panel) return;
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    function applyFilters() {
        filterProducts();
        document.getElementById('filterPanel').style.display = 'none';
    }

    function clearFilters() {
        const f1 = document.getElementById('filterProductType'); if (f1) f1.value = '';
        const f2 = document.getElementById('filterBrand'); if (f2) f2.value = '';
        const f3 = document.getElementById('filterStockStatus'); if (f3) f3.value = '';
        document.getElementById('searchInput').value = '';
        filterProducts();
    }

    function openAddModal() {
        editingProductId = null;
        const modalTitle = document.getElementById('modalTitle');
        const productName = document.getElementById('productName');
        const productDescription = document.getElementById('productDescription');
        const productPrice = document.getElementById('productPrice');
        const productStock = document.getElementById('productStock');
        const productCategory = document.getElementById('productCategory');
        const productBrand = document.getElementById('productBrand');
        const modalError = document.getElementById('modalError');
        const productModal = document.getElementById('productModal');

        if (!modalTitle || !productName || !productDescription || !productPrice || !productStock || !productCategory || !modalError || !productModal) {
            console.error('Modal elements not found. Make sure you are on the Products page.');
            return;
        }

        modalTitle.innerText = 'Add Product';
        productName.value = '';
        productDescription.value = '';
        productPrice.value = '';
        productStock.value = '';
        productCategory.value = '';
        if (productBrand) productBrand.value = '';
        modalError.style.display = 'none';
        // set initial stock status badge and listen to changes
        const stockStatusSpan = document.getElementById('productStockStatus');
        if (stockStatusSpan) stockStatusSpan.innerText = computeStockStatus(0);
        if (productStock) {
            productStock.addEventListener('input', onStockInputChange);
        }
        productModal.classList.add('show');
    }

    function openEditModal(id, name, description, price, stock, productType, brand) {
        editingProductId = id;
        const modalTitle = document.getElementById('modalTitle');
        const productName = document.getElementById('productName');
        const productDescription = document.getElementById('productDescription');
        const productPrice = document.getElementById('productPrice');
        const productStock = document.getElementById('productStock');
        const productCategory = document.getElementById('productCategory');
        const productBrand = document.getElementById('productBrand');
        const modalError = document.getElementById('modalError');
        const productModal = document.getElementById('productModal');

        if (!modalTitle || !productName || !productDescription || !productPrice || !productStock || !productCategory || !modalError || !productModal) {
            console.error('Modal elements not found. Make sure you are on the Products page.');
            return;
        }

        modalTitle.innerText = 'Edit Product';
        productName.value = name;
        productDescription.value = description;
        productPrice.value = price;
        productStock.value = stock;
        productCategory.value = productType;
        if (productBrand) productBrand.value = brand || '';
        modalError.style.display = 'none';
        // update stock status badge and listen to stock changes
        const stockStatusSpan = document.getElementById('productStockStatus');
        if (stockStatusSpan) stockStatusSpan.innerText = computeStockStatus(parseInt(stock || 0));
        if (productStock) {
            productStock.removeEventListener('input', onStockInputChange);
            productStock.addEventListener('input', onStockInputChange);
        }
        productModal.classList.add('show');
    }

    function closeModal() {
        const productModal = document.getElementById('productModal');
        if (productModal) {
            productModal.classList.remove('show');
        }
    }

    function onStockInputChange(e) {
        const v = parseInt(e.target.value || 0);
        const span = document.getElementById('productStockStatus');
        if (span) span.innerText = computeStockStatus(v);
    }

    async function saveProduct(event) {
        event.preventDefault();
        const token = getToken();
        const name = document.getElementById('productName').value.trim();
        const description = document.getElementById('productDescription').value.trim();
        const price = parseFloat(document.getElementById('productPrice').value);
        const stock = parseInt(document.getElementById('productStock').value);
        const productType = document.getElementById('productCategory').value;
        const brand = (document.getElementById('productBrand') && document.getElementById('productBrand').value) || '';

        if (!name || isNaN(price) || price < 0) {
            document.getElementById('modalError').innerText = 'Name and valid price are required';
            document.getElementById('modalError').style.display = 'block';
            return;
        }

        const method = editingProductId ? 'PUT' : 'POST';
        const url = editingProductId ? `/api/products/${editingProductId}` : '/api/products';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                authorization: token
            },
            body: JSON.stringify({ name, description, price, stock, productType, brand })
        });
        const data = await res.json();
        if (data.success) {
            closeModal();
            loadProducts();
            adminApp.showToast(editingProductId ? 'Product updated' : 'Product added');
        } else {
            document.getElementById('modalError').innerText = data.message || 'Error saving product';
            document.getElementById('modalError').style.display = 'block';
        }
    }

    // Helper: compute stock status (mirror of backend logic)
    function computeStockStatus(stock) {
        const s = (typeof stock === 'number' && !isNaN(stock)) ? stock : parseInt(stock) || 0;
        if (s === 0) return 'out of stock';
        if (s <= 5) return 'low stock';
        return 'in stock';
    }

    async function deleteProduct(id) {
        if (!confirm('Are you sure you want to delete this product?')) return;
        const token = getToken();
        const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: { authorization: token }
        });
        const data = await res.json();
        if (data.success) {
            loadProducts();
            adminApp.showToast('Product deleted');
        } else {
            adminApp.showToast('Error deleting product: ' + data.message, 'error');
        }
    }

    function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;'); }

    function init() {
        // ensure product types and brands are loaded before products so names can be mapped
        Promise.all([loadProductTypes(), loadBrands()]).then(() => loadProducts()).catch(() => loadProducts());
        // Attach functions to window for global access
        window.openProductModal = openAddModal;
        window.editProductModal = openEditModal;
        window.closeProductModal = closeModal;
        window.saveProduct = saveProduct;
        window.deleteProduct = deleteProduct;
        window.changePage = changePage;
        window.goToPage = goToPage;
        // filter controls
        const filterBtn = document.getElementById('filterToggleBtn');
        if (filterBtn) filterBtn.addEventListener('click', toggleFilterPanel);
        const applyBtn = document.getElementById('applyFiltersBtn');
        if (applyBtn) applyBtn.addEventListener('click', applyFilters);
        const clearBtn = document.getElementById('clearFiltersBtn');
        if (clearBtn) clearBtn.addEventListener('click', clearFilters);
        // sort controls
        const sortBtn = document.getElementById('sortToggleBtn');
        if (sortBtn) sortBtn.addEventListener('click', toggleSortPanel);
        const applySortBtn = document.getElementById('applySortBtn');
        if (applySortBtn) applySortBtn.addEventListener('click', applySort);
        const clearSortBtn = document.getElementById('clearSortBtn');
        if (clearSortBtn) clearSortBtn.addEventListener('click', clearSort);
        document.getElementById('entriesPerPage').addEventListener('change', () => { currentPage = 1; renderTable(); });
        document.getElementById('searchInput').addEventListener('input', filterProducts);
    }

    return { init };
})();