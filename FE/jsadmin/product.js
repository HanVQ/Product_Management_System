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

    // Load sizes and colors for variant management
    // Load sizes and colors for variant management
    let allSizes = [];
    let allColors = [];
    let editingVariantId = null;
    async function loadSizesAndColors() {
        const token = getToken();
        try {
            const [sRes, cRes] = await Promise.all([
                fetch('/api/sizes', { headers: { authorization: token } }),
                fetch('/api/colors', { headers: { authorization: token } })
            ]);
            const sData = await sRes.json();
            const cData = await cRes.json();
            allSizes = sData.sizes || [];
            allColors = cData.colors || [];
            populateSizeColorDropdowns();
        } catch (err) {
            console.warn('Could not load sizes/colors:', err.message);
        }
    }

    function populateSizeColorDropdowns() {
        const sizeSel = document.getElementById('variantSize');
        const colorSel = document.getElementById('variantColor');
        if (sizeSel) {
            const cur = sizeSel.value;
            sizeSel.innerHTML = '<option value="">(none)</option>';
            allSizes.forEach(s => {
                const o = document.createElement('option'); o.value = s._id; o.textContent = s.name; sizeSel.appendChild(o);
            });
            if (cur) sizeSel.value = cur;
        }
        if (colorSel) {
            const curc = colorSel.value;
            colorSel.innerHTML = '<option value="">(none)</option>';
            allColors.forEach(c => {
                const o = document.createElement('option'); o.value = c._id; o.textContent = c.name; colorSel.appendChild(o);
            });
            if (curc) colorSel.value = curc;
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
            if (cur) {
                filterSelect.value = cur;
            }
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
            if (cur) {
                filterBrand.value = cur;
            }
        }
    }

    async function loadProducts() {
        const token = getToken();
        const out = document.getElementById('results');
        if (!token) {
            out.innerText = 'No token available. Please login as admin.';
            return;
        }

        // Build query params from current filters
        const searchQuery = document.getElementById('searchInput').value || '';
        const filterType = (document.getElementById('filterProductType') && document.getElementById('filterProductType').value) || '';
        const filterBrand = (document.getElementById('filterBrand') && document.getElementById('filterBrand').value) || '';
        // Build query string
        const params = new URLSearchParams();
        if (searchQuery) {
            params.append('search', searchQuery);
        }
        if (filterType) {
            params.append('productType', filterType);
        }
        if (filterBrand) {
            params.append('brand', filterBrand);
        }
        if (currentSortField) {
            params.append('sortField', currentSortField);
            params.append('sortOrder', currentSortOrder === 'desc' ? -1 : 1);
        }
        params.append('page', currentPage);
        const limit = Math.max(1, parseInt(document.getElementById('entriesPerPage').value) || 10);
        params.append('limit', limit);

        const res = await fetch(`/api/products?${params.toString()}`, { headers: { authorization: token } });
        const data = await res.json();
        if (!data.success) {
            out.innerText = 'Error loading products: ' + (data.message || JSON.stringify(data));
            return;
        }

        allProducts = data.products || [];
        // attach product type and brand name for rendering
        // calculate total stock from variants
        allProducts.forEach(p => {
            const pt = allProductTypes.find(t => String(t._id) === String(p.productType));
            p._productTypeName = pt ? pt.name : '';
            const b = allBrands.find(x => String(x._id) === String(p.brand || p.brandId || ''));
            p._brandName = b ? b.name : '';
            // Display total stock from variants (totalStock field from backend)
            p._displayStock = (typeof p.totalStock !== 'undefined' && p.totalStock !== null) ? p.totalStock : 0;
        });

        filteredProducts = [...allProducts];

        // Update pagination info from backend
        const pagination = data.pagination || { page: 1, limit, total: 0, pages: 1 };

        renderTable(pagination);
    }

    function renderTable(pagination) {
        const perPage = pagination ? pagination.limit : (Math.max(1, parseInt(document.getElementById('entriesPerPage').value) || 10));

        // Data is already paginated from backend, no need to slice
        const pageData = filteredProducts;

        let html = '<div class="table-responsive"><table><thead><tr><th style="width:50px">#</th><th>Name</th><th>Description</th><th>Price</th><th>Stock</th><th>Brand</th><th>Product Type</th><th>Status</th><th style="width:300px">Action</th></tr></thead><tbody>';
        pageData.forEach((p, idx) => {
            const productTypeName = p._productTypeName || (allProductTypes.find(pt => String(pt._id) === String(p.productType)) || {}).name || '';
            const brandName = p._brandName || (allBrands.find(br => String(br._id) === String(p.brand || p.brandId || '')) || {}).name || '';
            const rowNum = (pagination ? (pagination.page - 1) * pagination.limit : currentPage - 1 * perPage) + idx + 1;
            const statusClass = p.status === 'Active' ? 'status-active' : 'status-inactive';
            const statusText = p.status || 'Active';
            html += `<tr>
                <td>${rowNum}</td>
                <td>${p.name || ''}</td>
                <td>${(p.description || '').substring(0, 50)}${(p.description || '').length > 50 ? '...' : ''}</td>
                <td>${p.price.toLocaleString('vi-VN')} ₫</td>
                <td>${p._displayStock || 0}</td>
                <td>${brandName}</td>
                <td>${productTypeName}</td>
                <td><span class="status-badge ${statusClass}" onclick="toggleProductStatus('${p._id}')" style="cursor:pointer;">${statusText}</span></td>
                <td class="action"><div class="action-btns">
                    <button class="btn btn-warning" onclick="editProductModal('${p._id}', '${escapeHtml(p.name || '')}', '${escapeHtml(p.description || '')}', '${p.price || 0}', '${p.productType || ''}', '${p.brand || p.brandId || ''}')">Edit</button>
                    <button class="btn btn-secondary" onclick="openVariantsModal('${p._id}', '${escapeHtml(p.name || '')}')">Variants</button>
                    <button class="btn btn-danger" onclick="deleteProduct('${p._id}')">Delete</button>
                </div></td>
            </tr>`;
        });

        html += '</tbody></table></div>';
        document.getElementById('results').innerHTML = html;
        renderPagination(pagination || { page: currentPage, limit: perPage, total: allProducts.length, pages: Math.ceil(allProducts.length / perPage) });

        const start = (pagination ? (pagination.page - 1) * pagination.limit : (currentPage - 1) * perPage) + 1;
        const end = Math.min(start + pageData.length - 1, pagination ? pagination.total : allProducts.length);
        document.getElementById('infoText').innerText = `Showing ${start} to ${end} of ${pagination ? pagination.total : allProducts.length} entries`;
    }

    // Variants management
    let currentVariantsProductId = null;
    async function openVariantsModal(productId, productName) {
        currentVariantsProductId = productId;
        document.getElementById('variantsProductName').innerText = productName || '';
        document.getElementById('variantsError').style.display = 'none';
        document.getElementById('variantPrice').value = '';
        document.getElementById('variantStock').value = '';
        await loadSizesAndColors();
        await loadVariantsForProduct(productId);
        document.getElementById('variantsModal').classList.add('show');
    }

    function closeVariantsModal() {
        document.getElementById('variantsModal').classList.remove('show');
        currentVariantsProductId = null;
        editingVariantId = null;
        document.getElementById('variantForm').reset();
        document.querySelector('#variantForm button[type="submit"]').innerText = 'Add Variant';
    }

    async function loadVariantsForProduct(productId) {
        const token = getToken();
        try {
            const res = await fetch(`/api/productvariants?product=${productId}`, { headers: { authorization: token } });
            const data = await res.json();
            const list = data.variants || [];
            renderVariants(list);
        } catch (err) {
            document.getElementById('variantsList').innerText = 'Error loading variants';
        }
    }

    function renderVariants(list) {
        const cont = document.getElementById('variantsList');
        if (!cont) return;
        if (!list || list.length === 0) {
            cont.innerHTML = '<div style="text-align:center;padding:20px;color:#666">No variants found for this product.</div>';
            return;
        }
        let html = '<table style="width:100%;border-collapse:collapse;font-size:15px"><thead><tr style="background:#f0f0f0;font-weight:600"><th style="padding:12px;text-align:left;border-bottom:2px solid #ddd">SKU</th><th style="padding:12px;text-align:left;border-bottom:2px solid #ddd">Size</th><th style="padding:12px;text-align:left;border-bottom:2px solid #ddd">Color</th><th style="padding:12px;text-align:left;border-bottom:2px solid #ddd">Price</th><th style="padding:12px;text-align:left;border-bottom:2px solid #ddd">Stock</th><th style="padding:12px;text-align:center;border-bottom:2px solid #ddd">Action</th></tr></thead><tbody>';
        list.forEach(v => {
            const sizeName = (v.size && v.size.name) || (allSizes.find(s => s._id === (v.size || '')) || {}).name || '—';
            const colorName = (v.color && v.color.name) || (allColors.find(c => c._id === (v.color || '')) || {}).name || '—';
            html += `<tr style="border-bottom:1px solid #eee"><td style="padding:12px">${v.sku || '—'}</td><td style="padding:12px">${sizeName}</td><td style="padding:12px">${colorName}</td><td style="padding:12px">${(v.price || 0).toLocaleString('vi-VN')} ₫</td><td style="padding:12px">${v.stock || 0}</td><td style="padding:12px;text-align:center"><button class="btn btn-warning" onclick="editVariant('${v._id}')" style="padding:6px 12px;margin-right:6px;font-size:13px">Edit</button> <button class="btn btn-danger" onclick="deleteVariant('${v._id}')" style="padding:6px 12px;font-size:13px">Delete</button></td></tr>`;
        });
        html += '</tbody></table>';
        cont.innerHTML = html;
    }

    async function editVariant(id) {
        const token = getToken();
        try {
            const res = await fetch(`/api/productvariants/${id}`, { headers: { authorization: token } });
            const data = await res.json();
            if (data.variant) {
                const v = data.variant;
                editingVariantId = id;
                document.getElementById('variantSize').value = v.size ? (v.size._id || v.size) : '';
                document.getElementById('variantColor').value = v.color ? (v.color._id || v.color) : '';
                document.getElementById('variantPrice').value = v.price || '';
                document.getElementById('variantStock').value = v.stock || '';
                document.querySelector('#variantForm button[type="submit"]').innerText = 'Update Variant';
                document.getElementById('variantsError').style.display = 'none';
            }
        } catch (err) {
            document.getElementById('variantsError').innerText = 'Error loading variant: ' + err.message;
            document.getElementById('variantsError').style.display = 'block';
        }
    }

    async function saveVariant(e) {
        e.preventDefault();
        if (!currentVariantsProductId) return;
        const token = getToken();
        const size = document.getElementById('variantSize').value || null;
        const color = document.getElementById('variantColor').value || null;
        const price = document.getElementById('variantPrice').value ? parseFloat(document.getElementById('variantPrice').value) : undefined;
        const stock = document.getElementById('variantStock').value ? parseInt(document.getElementById('variantStock').value) : undefined;

        try {
            const method = editingVariantId ? 'PUT' : 'POST';
            const url = editingVariantId ? `/api/productvariants/${editingVariantId}` : '/api/productvariants';
            const body = editingVariantId
                ? { size: size || undefined, color: color || undefined, price, stock }
                : { product: currentVariantsProductId, size: size || undefined, color: color || undefined, price, stock };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', authorization: token },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                document.getElementById('variantPrice').value = '';
                document.getElementById('variantStock').value = '';
                document.getElementById('variantSize').value = '';
                document.getElementById('variantColor').value = '';
                editingVariantId = null;
                document.querySelector('#variantForm button[type="submit"]').innerText = 'Add Variant';
                document.querySelector('#variantForm button[type="submit"]').innerText = 'Edit Variant';
                await loadVariantsForProduct(currentVariantsProductId);
                // Reload products to update stock display
                await loadProducts();
            } else {
                document.getElementById('variantsError').innerText = data.message || 'Error saving variant';
                document.getElementById('variantsError').style.display = 'block';
            }
        } catch (err) {
            document.getElementById('variantsError').innerText = err.message;
            document.getElementById('variantsError').style.display = 'block';
        }
    }

    async function deleteVariant(id) {
        if (!confirm('Delete variant?')) return;
        const token = getToken();
        try {
            const res = await fetch(`/api/productvariants/${id}`, { method: 'DELETE', headers: { authorization: token } });
            const data = await res.json();
            if (data.success) {
                if (currentVariantsProductId) {
                    await loadVariantsForProduct(currentVariantsProductId);
                    await loadProducts();
                }
            } else {
                adminApp.showToast('Error deleting variant: ' + data.message, 'error');
            }
        } catch (err) {
            adminApp.showToast('Error deleting variant: ' + err.message, 'error');
        }
    }

    function sortProducts(arr) {
        // Sorting is now handled by the backend, no client-side sorting needed
        // This function is kept for reference but not used
        return;
    }

    function renderPagination(pagination) {
        const totalPages = pagination.pages || 1;
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
            for (let i = 1; i <= totalPages; i++) {
                pushBtn(i, i);
            }
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

    function filterProducts() {
        // Reset page to 1 when filtering changes
        currentPage = 1;
        loadProducts();
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
        currentPage = 1; // Reset to page 1
        loadProducts(); // Reload with new sort
        // hide panel after applying
        const panel = document.getElementById('sortPanel'); if (panel) panel.style.display = 'none';
    }

    function clearSort() {
        currentSortField = '';
        currentSortOrder = 'asc';
        const opt = document.getElementById('sortOption'); if (opt) opt.value = 'name:asc';
        currentPage = 1;
        loadProducts();
    }

    function toggleFilterPanel() {
        const panel = document.getElementById('filterPanel');
        if (!panel) return;
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    function applyFilters() {
        currentPage = 1;
        loadProducts();
        document.getElementById('filterPanel').style.display = 'none';
    }

    function clearFilters() {
        const f1 = document.getElementById('filterProductType');
        if (f1) {
            f1.value = '';
        }
        const f2 = document.getElementById('filterBrand');
        if (f2) {
            f2.value = '';
        }
        document.getElementById('searchInput').value = '';
        currentPage = 1;
        loadProducts();
    }

    function openAddModal() {
        editingProductId = null;
        const modalTitle = document.getElementById('modalTitle');
        const productName = document.getElementById('productName');
        const productDescription = document.getElementById('productDescription');
        const productPrice = document.getElementById('productPrice');
        const productCategory = document.getElementById('productCategory');
        const productBrand = document.getElementById('productBrand');
        const modalError = document.getElementById('modalError');
        const productModal = document.getElementById('productModal');

        if (!modalTitle || !productName || !productDescription || !productPrice || !productCategory || !modalError || !productModal) {
            console.error('Modal elements not found. Make sure you are on the Products page.');
            return;
        }

        modalTitle.innerText = 'Add Product';
        productName.value = '';
        productDescription.value = '';
        productPrice.value = '';
        productCategory.value = '';
        if (productBrand) {
            productBrand.value = '';
        }
        modalError.style.display = 'none';
        productModal.classList.add('show');
    }

    function openEditModal(id, name, description, price, productType, brand) {
        editingProductId = id;
        const modalTitle = document.getElementById('modalTitle');
        const productName = document.getElementById('productName');
        const productDescription = document.getElementById('productDescription');
        const productPrice = document.getElementById('productPrice');
        const productCategory = document.getElementById('productCategory');
        const productBrand = document.getElementById('productBrand');
        const modalError = document.getElementById('modalError');
        const productModal = document.getElementById('productModal');

        if (!modalTitle || !productName || !productDescription || !productPrice || !productCategory || !modalError || !productModal) {
            console.error('Modal elements not found. Make sure you are on the Products page.');
            return;
        }

        modalTitle.innerText = 'Edit Product';
        productName.value = name;
        productDescription.value = description;
        productPrice.value = price;
        productCategory.value = productType;
        if (productBrand) productBrand.value = brand || '';
        modalError.style.display = 'none';
        productModal.classList.add('show');
    }

    function closeModal() {
        const productModal = document.getElementById('productModal');
        if (productModal) {
            productModal.classList.remove('show');
        }
    }

    async function saveProduct(event) {
        event.preventDefault();
        const token = getToken();
        const name = document.getElementById('productName').value.trim();
        const description = document.getElementById('productDescription').value.trim();
        const price = parseFloat(document.getElementById('productPrice').value);
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
            body: JSON.stringify({ name, description, price, productType, brand })
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

    async function toggleProductStatus(id) {
        const token = getToken();
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', authorization: token },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (data.success) {
                loadProducts();
                adminApp.showToast(`Product status changed to ${data.product.status}`);
            } else {
                adminApp.showToast('Error updating product status: ' + data.message, 'error');
            }
        } catch (err) {
            adminApp.showToast('Error: ' + err.message, 'error');
        }
    }

    async function deleteProduct(id) {
        if (!confirm('Are you sure you want to permanently delete this product? This action cannot be undone.')) return;
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
        window.openVariantsModal = openVariantsModal;
        window.closeVariantsModal = closeVariantsModal;
        window.saveVariant = saveVariant;
        window.editVariant = editVariant;
        window.deleteVariant = deleteVariant;
        window.closeProductModal = closeModal;
        window.saveProduct = saveProduct;
        window.toggleProductStatus = toggleProductStatus;
        window.deleteProduct = deleteProduct;
        window.changePage = changePage;
        window.goToPage = goToPage;
        // filter controls
        const filterBtn = document.getElementById('filterToggleBtn');
        if (filterBtn) {
            filterBtn.addEventListener('click', toggleFilterPanel);
        }
        const applyBtn = document.getElementById('applyFiltersBtn');
        if (applyBtn) {
            applyBtn.addEventListener('click', applyFilters);
        }
        const clearBtn = document.getElementById('clearFiltersBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearFilters);
        }
        // sort controls
        const sortBtn = document.getElementById('sortToggleBtn');
        if (sortBtn) {
            sortBtn.addEventListener('click', toggleSortPanel);
        }
        const applySortBtn = document.getElementById('applySortBtn');
        if (applySortBtn) {
            applySortBtn.addEventListener('click', applySort);
        }
        const clearSortBtn = document.getElementById('clearSortBtn');
        if (clearSortBtn) {
            clearSortBtn.addEventListener('click', clearSort);
        }
        document.getElementById('entriesPerPage').addEventListener('change', () => { currentPage = 1; loadProducts(); });
        document.getElementById('searchInput').addEventListener('input', filterProducts);
    }

    return { init };
}());