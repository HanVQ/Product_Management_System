// Dashboard scripts
window.dashboardModule = (function () {
    function getToken() {
        return localStorage.getItem('token');
    }

    async function loadStats() {
        const token = getToken();
        if (!token) {
            return;
        }

        try {
            // Gọi API song song để lấy dữ liệu
            const [usersRes, customersRes, productsRes, brandsRes, productsTypeRes, ordersRes, inventoryRes] = await Promise.all([
                fetch('/api/users', { headers: { authorization: token } }),
                fetch('/api/customers', { headers: { authorization: token } }),
                fetch('/api/products', { headers: { authorization: token } }),
                fetch('/api/brands', { headers: { authorization: token } }),
                fetch('/api/producttypes', { headers: { authorization: token } }),
                fetch('/api/orders', { headers: { authorization: token } }),
                fetch('/api/inventory', { headers: { authorization: token } })
            ]);

            const usersData = await usersRes.json();
            const customersData = await customersRes.json();
            const productsData = await productsRes.json();
            const brandsData = await brandsRes.json();
            const productsTypeData = await productsTypeRes.json();
            const ordersData = await ordersRes.json();
            const inventoryData = await inventoryRes.json();

            // Cập nhật số liệu thống kê
            document.getElementById('statUsers').innerText = usersData.users?.length || 0;
            document.getElementById('statCustomers').innerText = customersData.customers?.length || 0;
            document.getElementById('statProducts').innerText = productsData.products?.length || 0;
            document.getElementById('statBrands').innerText = brandsData.data?.length || 0;
            document.getElementById('statProductsType').innerText = productsTypeData.data?.length || 0;
            document.getElementById('statOrders').innerText = ordersData.orders?.length || 0;
            document.getElementById('statInventory').innerText = inventoryData.transactions?.length || 0;

            // Hiển thị hoạt động gần đây (ví dụ lấy từ orders)
            const recentActivity = document.getElementById('recentActivity');
            recentActivity.innerHTML = '';
            if (ordersData.orders && ordersData.orders.length > 0) {
                ordersData.orders.slice(0, 5).forEach(o => {
                    const li = document.createElement('li');
                    li.innerText = `Order #${o._id} - ${o.status} - ${o.totalAmount.toLocaleString('vi-VN')} ₫`;
                    recentActivity.appendChild(li);
                });
            } else {
                recentActivity.innerHTML = '<li>No recent activity</li>';
            }
        } catch (err) {
            console.error('Error loading dashboard stats', err);
        }
    }

    function init() {
        loadStats();
    }

    return { init };
})();
