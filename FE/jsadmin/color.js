window.colorModule = (function () {
    let allColors = [];
    let editingColorId = null;

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
        let html = '<div class="table-responsive"><table><thead><tr><th>#</th><th>Name</th><th>Color</th><th style="width:150px">Action</th></tr></thead><tbody>';
        allColors.forEach((c, idx) => {
            html += `<tr><td>${idx + 1}</td><td>${c.name || ''}</td><td><div style="width:40px;height:40px;background-color:${c.hex || '#ccc'};border:1px solid #999;border-radius:4px;" title="${c.hex || 'N/A'}"></div></td><td><button class="btn btn-warning" onclick="editColor('${c._id}', '${c.name}', '${c.hex}')">Edit</button> <button class="btn btn-danger" onclick="deleteColor('${c._id}')">Delete</button></td></tr>`;
        });
        html += '</tbody></table></div>';
        cont.innerHTML = html;
    }

    function openAddColor() {
        editingColorId = null;
        document.getElementById('colorModalTitle').innerText = 'Add Color';
        document.getElementById('colorName').value = '';
        document.getElementById('colorHex').value = '#000000';
        document.getElementById('colorHexText').value = '#000000';
        document.getElementById('colorModalError').style.display = 'none';
        document.getElementById('colorModal').classList.add('show');
    }

    function openEditColor(id, name, hex) {
        editingColorId = id;
        document.getElementById('colorModalTitle').innerText = 'Edit Color';
        document.getElementById('colorName').value = name;
        document.getElementById('colorHex').value = hex || '#000000';
        document.getElementById('colorHexText').value = hex || '#000000';
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
        const hex = document.getElementById('colorHex').value.trim();
        if (!name) {
            document.getElementById('colorModalError').innerText = 'Name is required';
            document.getElementById('colorModalError').style.display = 'block';
            return;
        }
        if (!hex) {
            document.getElementById('colorModalError').innerText = 'Hex color is required';
            document.getElementById('colorModalError').style.display = 'block';
            return;
        }

        const method = editingColorId ? 'PUT' : 'POST';
        const url = editingColorId ? `/api/colors/${editingColorId}` : '/api/colors';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', authorization: token },
                body: JSON.stringify({ name, hex })
            });
            const data = await res.json();
            if (data.success) {
                closeColorModal();
                await loadColors();
                if (adminApp && adminApp.showToast) adminApp.showToast(editingColorId ? 'Color updated' : 'Color added');
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
        // Sync color picker and text input
        const colorHexInput = document.getElementById('colorHex');
        const colorHexText = document.getElementById('colorHexText');
        if (colorHexInput && colorHexText) {
            colorHexInput.addEventListener('input', (e) => {
                colorHexText.value = e.target.value;
            });
            colorHexText.addEventListener('input', (e) => {
                if (/^#([0-9A-F]{6}|[0-9A-F]{3}|[0-9a-f]{6}|[0-9a-f]{3})$/.test(e.target.value)) {
                    colorHexInput.value = e.target.value;
                }
            });
        }
        window.openColorModal = openAddColor;
        window.editColor = openEditColor;
        window.closeColorModal = closeColorModal;
        window.saveColor = saveColor;
        window.deleteColor = deleteColor;
    }

    return { init };
}());
