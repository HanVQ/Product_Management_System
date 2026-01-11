window.sizeModule = (function () {
    let allSizes = [];
    let editingSizeId = null;

    function getToken() {
        return localStorage.getItem('token');
    }

    async function loadSizes() {
        const token = getToken();
        try {
            const res = await fetch('/api/sizes', { headers: { authorization: token } });
            const data = await res.json();
            allSizes = data.sizes || [];
            renderSizes();
        } catch (err) {
            document.getElementById('sizeResults').innerText = 'Error loading sizes: ' + err.message;
        }
    }

    function renderSizes() {
        const cont = document.getElementById('sizeResults');
        if (!allSizes || allSizes.length === 0) {
            cont.innerHTML = '<p>No sizes found. Create one to get started.</p>';
            return;
        }
        let html = '<div class="table-responsive"><table><thead><tr><th>#</th><th>Name</th><th>Status</th><th style="width:150px">Action</th></tr></thead><tbody>';
        allSizes.forEach((s, idx) => {
            const statusClass = s.status === 'Active' ? 'status-active' : 'status-inactive';
            const statusText = s.status || 'Active';
            html += `<tr><td>${idx + 1}</td><td>${s.name || ''}</td><td><span class="status-badge ${statusClass}" onclick="toggleSizeStatus('${s._id}')" style="cursor:pointer;">${statusText}</span></td><td><button class="btn btn-warning" onclick="editSize('${s._id}', '${s.name}', '${s.status}')">Edit</button> <button class="btn btn-danger" onclick="deleteSize('${s._id}')">Delete</button></td></tr>`;
        });
        html += '</tbody></table></div>';
        cont.innerHTML = html;
    }

    function openAddSize() {
        editingSizeId = null;
        document.getElementById('sizeModalTitle').innerText = 'Add Size';
        document.getElementById('sizeName').value = '';
        document.getElementById('sizeStatus').value = 'Active';
        document.getElementById('sizeModalError').style.display = 'none';
        document.getElementById('sizeModal').classList.add('show');
    }

    function openEditSize(id, name, status) {
        editingSizeId = id;
        document.getElementById('sizeModalTitle').innerText = 'Edit Size';
        document.getElementById('sizeName').value = name;
        document.getElementById('sizeStatus').value = status || 'Active';
        document.getElementById('sizeModalError').style.display = 'none';
        document.getElementById('sizeModal').classList.add('show');
    }

    function closeSizeModal() {
        document.getElementById('sizeModal').classList.remove('show');
    }

    async function saveSize(event) {
        event.preventDefault();
        const token = getToken();
        const name = document.getElementById('sizeName').value.trim();
        const status = document.getElementById('sizeStatus').value;
        if (!name) {
            document.getElementById('sizeModalError').innerText = 'Name is required';
            document.getElementById('sizeModalError').style.display = 'block';
            return;
        }

        const method = editingSizeId ? 'PUT' : 'POST';
        const url = editingSizeId ? `/api/sizes/${editingSizeId}` : '/api/sizes';

        try {
            const res = await fetch(url,{
                method,
                headers: { 'Content-Type': 'application/json', authorization: token },
                body: JSON.stringify({ name, status })
            });
            const data = await res.json();
            if (data.success) {
                closeSizeModal();
                await loadSizes();
                if (adminApp && adminApp.showToast) adminApp.showToast(editingSizeId ? 'Size updated' : 'Size added');
            } else {
                document.getElementById('sizeModalError').innerText = data.message || 'Error saving size';
                document.getElementById('sizeModalError').style.display = 'block';
            }
        } catch (err) {
            document.getElementById('sizeModalError').innerText = err.message;
            document.getElementById('sizeModalError').style.display = 'block';
        }
    }

    async function deleteSize(id) {
        if (!confirm('Delete this size?')) return;
        const token = getToken();
        try {
            const res = await fetch(`/api/sizes/${id}`, {
                method: 'DELETE',
                headers: { authorization: token }
            });
            const data = await res.json();
            if (data.success) {
                await loadSizes();
                if (adminApp && adminApp.showToast) adminApp.showToast('Size deleted');
            } else {
                if (adminApp && adminApp.showToast) adminApp.showToast('Error deleting size: ' + data.message, 'error');
            }
        } catch (err) {
            if (adminApp && adminApp.showToast) adminApp.showToast('Error: ' + err.message, 'error');
        }
    }

    async function toggleSizeStatus(id) {
        const token = getToken();
        try {
            const res = await fetch(`/api/sizes/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', authorization: token },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (data.success) {
                loadSizes();
            } else {
                if (adminApp && adminApp.showToast) adminApp.showToast('Error updating size status: ' + data.message, 'error');
            }
        } catch (err) {
            if (adminApp && adminApp.showToast) adminApp.showToast('Error: ' + err.message, 'error');
        }
    }

    function init() {
        loadSizes();
        window.openSizeModal = openAddSize;
        window.editSize = openEditSize;
        window.closeSizeModal = closeSizeModal;
        window.saveSize = saveSize;
        window.deleteSize = deleteSize;
        window.toggleSizeStatus = toggleSizeStatus;
    }

    return { init };
}());
