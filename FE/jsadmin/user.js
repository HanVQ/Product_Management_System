// User management scripts (moved from inline admin)
window.userModule = (function () {
  let allUsers = [];
  let filteredUsers = [];
  let currentPage = 1;
  let editingUserId = null;

  function getToken() {
    return localStorage.getItem('token');
  }

  async function loadUsers() {
    const token = getToken();
    const out = document.getElementById('results');
    if (!token) { 
      out.innerText = 'No token available. Please login as admin.'; 
      return; 
    }
    const res = await fetch('/api/users', { headers: { authorization: token } });
    const data = await res.json();
    if (!data.success) { 
      out.innerText = 'Error loading users: ' + (data.message || JSON.stringify(data)); 
      return; 
    }
    allUsers = data.users || [];
    filteredUsers = [...allUsers];
    currentPage = 1;
    renderTable();
  }

  function renderTable() {
    const perPage = parseInt(document.getElementById('entriesPerPage').value);
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageData = filteredUsers.slice(start, end);

    let html = '<div class="table-responsive"><table><thead><tr><th style="width:50px">#</th><th>Name</th><th>Email</th><th style="width:120px">Role</th><th style="width:120px">Provider</th><th style="width:140px">Action</th></tr></thead><tbody>';
    pageData.forEach((u, idx) => {
      html += `<tr>
        <td>${start + idx + 1}</td>
        <td>${u.name || ''}</td>
        <td>${u.email || ''}</td>
        <td>${u.role || ''}</td>
        <td>${u.provider || 'email'}</td>
        <td class="action"><div class="action-btns">
          <button class="btn btn-warning" onclick="openEditModal('${u._id}', '${escapeHtml(u.name || '')}', '${escapeHtml(u.email || '')}', '${u.role || 'user'}')">Edit</button>
          <button class="btn btn-danger" onclick="deleteUser('${u._id}')">Delete</button>
        </div></td>
      </tr>`;
    });
    html += '</tbody></table></div>';
    document.getElementById('results').innerHTML = html;
    renderPagination(perPage);
    document.getElementById('infoText').innerText = `Showing ${start + 1} to ${Math.min(end, filteredUsers.length)} of ${filteredUsers.length} entries (filtered from ${allUsers.length} total entries)`;
  }

  function renderPagination(perPage) {
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage));
    const maxButtons = 7; // max numeric page buttons to show (including first/last)
    let parts = [];

    function pushBtn(label, page, cls) {
      if (page === null) { 
        parts.push(`<span class="ellipsis">${label}</span>`); 
        return; 
      }
      const c = cls ? cls : (page === currentPage ? 'btn active' : 'btn');
      parts.push(`<button class="${c}" onclick="goToPage(${page})">${label}</button>`);
    }

    // First / Prev
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
      // always show 1 and last, with window around currentPage
      const left = Math.max(2, currentPage - 2);
      const right = Math.min(totalPages - 1, currentPage + 2);

      pushBtn(1, 1);
      if (left > 2) pushBtn('...', null);
      for (let i = left; i <= right; i++) pushBtn(i, i);
      if (right < totalPages - 1) pushBtn('...', null);
      pushBtn(totalPages, totalPages);
    }

    // Next / Last
    if (currentPage < totalPages) { 
      pushBtn('>', currentPage + 1, 'btn'); 
      pushBtn('>>', totalPages, 'btn'); 
    } else { 
      pushBtn('>', null, 'btn'); 
      pushBtn('>>', totalPages, 'btn'); 
    }

    document.getElementById('pagination').innerHTML = parts.join('');
  }

  function goToPage(page) { currentPage = page; renderTable(); }

  function filterTable() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    filteredUsers = allUsers.filter(u => (u.name || '').toLowerCase().includes(query) || (u.email || '').toLowerCase().includes(query));
    currentPage = 1;
    renderTable();
  }

  function openAddModal() {
    editingUserId = null;
    const modalTitle = document.getElementById('modalTitle');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userPassword = document.getElementById('userPassword');
    const userRole = document.getElementById('userRole');
    const modalError = document.getElementById('modalError');
    const userModal = document.getElementById('userModal');

    if (!modalTitle || !userName || !userEmail || !userPassword || !userRole || !modalError || !userModal) {
      console.error('Modal elements not found. Make sure you are on the Users page.');
      return;
    }

    modalTitle.innerText = 'Add User';
    userName.value = '';
    userEmail.value = '';
    userPassword.value = '';
    userPassword.required = true;
    userRole.value = 'user';
    modalError.style.display = 'none';
    userModal.classList.add('show');
  }

  function openEditModal(id, name, email, role) {
    editingUserId = id;
    const modalTitle = document.getElementById('modalTitle');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userPassword = document.getElementById('userPassword');
    const userRole = document.getElementById('userRole');
    const modalError = document.getElementById('modalError');
    const userModal = document.getElementById('userModal');

    if (!modalTitle || !userName || !userEmail || !userPassword || !userRole || !modalError || !userModal) {
      console.error('Modal elements not found. Make sure you are on the Users page.');
      return;
    }

    modalTitle.innerText = 'Edit User';
    userName.value = name;
    userEmail.value = email;
    userPassword.value = '';
    userPassword.required = false;
    userPassword.placeholder = 'Leave blank to keep current password';
    userRole.value = role;
    modalError.style.display = 'none';
    userModal.classList.add('show');
  }

  function closeModal() {
    const userModal = document.getElementById('userModal');
    if (userModal) {
      userModal.classList.remove('show');
    }
  }

  async function saveUser(e) {
    e.preventDefault();
    const token = getToken();
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    const body = { name, email, role };
    if (password) {
      body.password = password;
    }
    const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users';
    const method = editingUserId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', authorization: token }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { closeModal(); loadUsers(); if (window.adminApp && typeof window.adminApp.showToast === 'function') adminApp.showToast('Saved successfully', 'success'); }
      else { document.getElementById('modalError').innerText = data.message || 'Error saving user'; document.getElementById('modalError').style.display = 'block'; if (window.adminApp && typeof window.adminApp.showToast === 'function') adminApp.showToast(data.message || 'Error saving user', 'error'); }
    } catch (err) { document.getElementById('modalError').innerText = 'Request failed: ' + err.message; document.getElementById('modalError').style.display = 'block'; }
  }

  // notify on delete
  async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    const token = getToken();
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE', headers: { authorization: token } });
      const data = await res.json();
      if (data.success) { loadUsers(); if (window.adminApp && typeof window.adminApp.showToast === 'function') adminApp.showToast('Deleted successfully', 'success'); }
      else { if (window.adminApp && typeof window.adminApp.showToast === 'function') adminApp.showToast(data.message || 'Error deleting user', 'error'); alert('Error deleting user: ' + (data.message || 'Unknown error')); }
    } catch (err) { if (window.adminApp && typeof window.adminApp.showToast === 'function') adminApp.showToast(err.message, 'error'); alert('Request failed: ' + err.message); }
  }

  function logout() { localStorage.removeItem('token'); localStorage.removeItem('user'); location = '/'; }

  function escapeHtml(str) { return String(str).replace(/'/g, "&#39;").replace(/"/g, '&quot;'); }

  // init called by admin loader
  async function init() {
    // wire global functions used by inline attributes
    window.openAddModal = openAddModal;
    window.openEditModal = openEditModal;
    window.closeModal = closeModal;
    window.saveUser = saveUser;
    window.deleteUser = deleteUser;
    window.logout = logout;
    window.filterTable = filterTable;
    window.goToPage = goToPage;
    document.getElementById('entriesPerPage').addEventListener('change', () => { currentPage = 1; renderTable(); });
    document.getElementById('searchInput').addEventListener('input', filterTable);

    const token = getToken();
    if (!token) { 
      location = '/';
      return; }
    try {
      const res = await fetch('/api/verify', { headers: { authorization: token } });
      const data = await res.json();
      if (!data.success || !data.user || data.user.role !== 'admin') { 
        location = '/'; 
      } else { 
        localStorage.setItem('user', JSON.stringify(data.user)); 
        await loadUsers(); 
        if (window.adminApp && typeof window.adminApp.showSidebarUser === 'function') adminApp.showSidebarUser(); 
      }
    } catch (err) { console.error('Verify request failed', err); location = '/'; }
  }

  return { init };
})();
