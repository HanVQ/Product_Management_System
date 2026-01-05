// Admin layout loader: loads fragments into #adminContent
const adminApp = (function () {
  async function loadFragment(path) {
    const res = await fetch(path);
    const html = await res.text();
    document.getElementById('adminContent').innerHTML = html;

    // Initialize the appropriate module
    if (window.dashboardModule && typeof window.dashboardModule.init === 'function' && path.includes('dashboard.html')) {
      window.dashboardModule.init();
    }
    if (window.userModule && typeof window.userModule.init === 'function' && path.includes('user.html')) {
      window.userModule.init();
    }
    if (window.brandModule && typeof window.brandModule.init === 'function' && path.includes('brand.html')) {
      window.brandModule.init();
    }
    if (window.customerModule && typeof window.customerModule.init === 'function' && path.includes('customer.html')) {
      window.customerModule.init();
    }
    if (window.productModule && typeof window.productModule.init === 'function' && path.includes('product.html')) {
      window.productModule.init();
    }
    if (window.productTypeModule && typeof window.productTypeModule.init === 'function' && path.includes('producttype.html')) {
      window.productTypeModule.init();
    }
    if (window.orderModule && typeof window.orderModule.init === 'function' && path.includes('order.html')) {
      window.orderModule.init();
    }
    if (window.inventoryModule && typeof window.inventoryModule.init === 'function' && path.includes('inventory.html')) {
      window.inventoryModule.init();
    }
  }

  function showSidebarUser() {
    try {
      const raw = localStorage.getItem('user');
      const user = raw ? JSON.parse(raw) : null;
      const el = document.getElementById('sidebarUser');
      if (!el) { 
        return; 
      }

      if (user) {
        const img = user.avatar ? `<img src="${user.avatar}" alt="avatar">` : `<div style="width:40px;height:40px;border-radius:50%;background:#eee"></div>`;
        el.innerHTML = `${img}<div class="name">${escapeHtml(user.name || user.email || 'Admin')}</div>`;
      } else {
        el.innerHTML = '';
      }
    } catch (e) {/* ignore */ }
  }

  function showToast(message, type = 'success') {
    let t = document.getElementById('globalToast');
    if (!t) { 
      t = document.createElement('div'); 
      t.id = 'globalToast'; 
      t.className = 'toast'; 
      document.body.appendChild(t); 
    }
    t.className = `toast show ${type}`;
    t.innerText = message;
    setTimeout(() => { t.className = 'toast'; }, 3000);
  }

  function setupMenu() {
    document.getElementById('linkDashboard').addEventListener('click', (e) => { e.preventDefault(); loadFragment('/admin/dashboard.html'); });
    document.getElementById('linkUsers').addEventListener('click', (e) => { e.preventDefault(); loadFragment('/admin/user.html'); });
    document.getElementById('linkCustomers').addEventListener('click', (e) => { e.preventDefault(); loadFragment('/admin/customer.html'); });
    document.getElementById('linkProducts').addEventListener('click', (e) => { e.preventDefault(); loadFragment('/admin/product.html'); });
    document.getElementById('linkBrands').addEventListener('click', (e) => { e.preventDefault(); loadFragment('/admin/brand.html'); });
    document.getElementById('linkProductTypes').addEventListener('click', (e) => { e.preventDefault(); loadFragment('/admin/producttype.html'); });
    document.getElementById('linkOrders').addEventListener('click', (e) => { e.preventDefault(); loadFragment('/admin/order.html'); });
    document.getElementById('linkInventory').addEventListener('click', (e) => { e.preventDefault(); loadFragment('/admin/inventory.html'); });
    document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem('token'); localStorage.removeItem('user'); location = '/'; });
  }

  function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;'); }

  // Toggle sidebar collapsed state and persist in localStorage
  function toggleSidebar(save = true) {
    const sb = document.getElementById('sidebar');
    if (!sb) { 
      return; 
    }
    sb.classList.toggle('collapsed');
    if (save) { 
      localStorage.setItem('sidebarCollapsed', sb.classList.contains('collapsed') ? '1' : '0'); 
    }
  }

  function init() {
    // Hiển thị thông tin user ở sidebar
    showSidebarUser();

    // Gắn sự kiện cho menu sidebar
    setupMenu();

    // Khôi phục trạng thái sidebar (collapsed hay không)
    const collapsed = localStorage.getItem('sidebarCollapsed');
    if (collapsed === '1') {
      const sb = document.getElementById('sidebar');
      if (sb) sb.classList.add('collapsed');
    }

    // Gắn sự kiện toggle sidebar
    const t = document.getElementById('sidebarToggle');
    if (t) {
      t.addEventListener('click', (e) => {
        e.preventDefault();
        toggleSidebar();
      });
    }

    loadFragment('/admin/dashboard.html');
  }

  return { init, loadFragment, showToast, showSidebarUser, toggleSidebar };
})();
