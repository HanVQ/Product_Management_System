window.sizeModule = (function () {
    let allSizes = [];

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
        let html = '<div class="table-responsive"><table><thead><tr><th>#</th><th>Name</th><th style="width:100px">Action</th></tr></thead><tbody>';
        allSizes.forEach((s, idx) => {
            html += `<tr><td>${idx + 1}</td><td>${s.name || ''}</td><td><button class="btn btn-danger" onclick="deleteSize('${s._id}')">Delete</button></td></tr>`;
        });
        html += '</tbody></table></div>';
        cont.innerHTML = html;
    }

    function openSizeModal() {
        document.getElementById('sizeModalTitle').innerText = 'Add Size';
        document.getElementById('sizeName').value = '';
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
        if (!name) {
            document.getElementById('sizeModalError').innerText = 'Name is required';
            document.getElementById('sizeModalError').style.display = 'block';
            return;
        }

        try {
            const res = await fetch('/api/sizes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', authorization: token },
                body: JSON.stringify({ name })
            });
            const data = await res.json();
            if (data.success) {
                closeSizeModal();
                await loadSizes();
                if (adminApp && adminApp.showToast) adminApp.showToast('Size added');
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

    function init() {
        loadSizes();
        window.openSizeModal = openSizeModal;
        window.closeSizeModal = closeSizeModal;
        window.saveSize = saveSize;
        window.deleteSize = deleteSize;
    }

    return { init };
}());
