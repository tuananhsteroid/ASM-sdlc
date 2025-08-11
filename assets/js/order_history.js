document.addEventListener('DOMContentLoaded', () => {
    loadOrderHistory();
});

async function loadOrderHistory() {
    const orderListEl = document.getElementById('order-history-list');
    orderListEl.innerHTML = '<div class="loading-message">Đang tải lịch sử đơn hàng...</div>';

    try {
        const res = await fetch('api/user/read_orders.php');
        const data = await res.json();

        if (data.success && data.orders.length > 0) {
            displayOrderHistory(data.orders);
        } else {
            orderListEl.innerHTML = '<div class="no-orders-message">Bạn chưa có đơn hàng nào.</div>';
        }
    } catch (e) {
        orderListEl.innerHTML = '<div class="error-message">Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.</div>';
        console.error("Lỗi khi tải lịch sử đơn hàng:", e);
    }
}

function displayOrderHistory(orders) {
    const orderListEl = document.getElementById('order-history-list');
    orderListEl.innerHTML = ''; // Xóa thông báo loading

    orders.forEach(order => {
        const orderHtml = `
            <div class="order-item">
                <div class="order-header">
                    <strong>Mã đơn hàng: #${order.OrderID}</strong>
                    <span>Ngày đặt: ${order.OrderDate}</span>
                    <span class="order-status">${order.Status}</span>
                </div>
                <div class="order-details">
                    ${order.order_details.map(detail => `
                        <div class="order-detail-item">
                            <img src="${detail.ImageURL}" alt="${detail.ProductName}" class="product-image">
                            <div class="product-info">
                                <p class="product-name">${detail.ProductName}</p>
                                <p class="product-quantity">Số lượng: ${detail.Quantity}</p>
                                <p class="product-price">${Number(detail.PriceAtPurchase).toLocaleString('vi-VN')}₫</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        orderListEl.innerHTML += orderHtml;
    });
}