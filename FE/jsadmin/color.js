window.colorModule = (function () {
    let allColors = [];

    function getToken() {
        return localStorage.getItem('token');
    }

    async function loadColors() {
        const token = getToken();
        try {
            const res = await fetch('/api/colors', { headers: { authorization: token } });
            const data = await res.json();
            allColors = data.colors || [];
            renderColors();
        } catch (err) {
            document.getElementById('colorResults').innerText = 'Error loading colors: ' + err.message;
        }
    }

    function renderColors() {
        const cont = document.getElementById('colorResults');
        if (!allColors || allColors.length === 0) {
            cont.innerHTML = '<p>No colors found. Create one to get started.</p>';
            return;
        }
        let html = '<div class="table-responsive"><table><thead><tr><th>#</th><th>Name</th><th style="width:100px">Action</th></tr></thead><tbody>';
        allColors.forEach((c, idx) => {
            html += `<tr><td>${idx + 1}</td><td>${c.name || ''}</td><td><button class="btn btn-danger" onclick="deleteColor('${c._id}')">Delete</button></td></tr>`;
        });
        html += '</tbody></table></div>';
        cont.innerHTML = html;
    }

    function openColorModal() {
        document.getElementById('colorModalTitle').innerText = 'Add Color';
        document.getElementById('colorName').value = '';
        document.getElementById('colorModalError').style.display = 'none';
        document.getElementById('colorModal').classList.add('show');
    }

    function closeColorModal() {
        document.getElementById('colorModal').classList.remove('show');
    }

    async function saveColor(event) {
        event.preventDefault();
        const token = getToken();
        const name = document.getElementById('colorName').value.trim();
        if (!name) {
            document.getElementById('colorModalError').innerText = 'Name is required';
            document.getElementById('colorModalError').style.display = 'block';
            return;
        }

        try {
            const res = await fetch('/api/colors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', authorization: token },
                body: JSON.stringify({ name })
            });
            const data = await res.json();
            if (data.success) {
                closeColorModal();
                await loadColors();
                if (adminApp && adminApp.showToast) adminApp.showToast('Color added');
            } else {
                document.getElementById('colorModalError').innerText = data.message || 'Error saving color';
                document.getElementById('colorModalError').style.display = 'block';
            }
        } catch (err) {
            document.getElementById('colorModalError').innerText = err.message;
            document.getElementById('colorModalError').style.display = 'block';
        }
    }

    async function deleteColor(id) {
        if (!confirm('Delete this color?')) return;
        const token = getToken();
        try {
            const res = await fetch(`/api/colors/${id}`, {
                method: 'DELETE',
                headers: { authorization: token }
            });
            const data = await res.json();
            if (data.success) {
                await loadColors();
                if (adminApp && adminApp.showToast) adminApp.showToast('Color deleted');
            } else {
                if (adminApp && adminApp.showToast) adminApp.showToast('Error deleting color: ' + data.message, 'error');
            }
        } catch (err) {
            if (adminApp && adminApp.showToast) adminApp.showToast('Error: ' + err.message, 'error');
        }
    }

    function init() {
        loadColors();
        window.openColorModal = openColorModal;
        window.closeColorModal = closeColorModal;
        window.saveColor = saveColor;
        window.deleteColor = deleteColor;
    }

    return { init };
}());
