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
            <div class="order-card">
                <div class="order-header">
                    <span class="order-id">Đơn hàng #${order.OrderID}</span>
                    <span class="order-date">Ngày đặt: ${order.OrderDate}</span>
                    <span class="order-status ${order.Status === 'completed' ? 'completed' : 'pending'}">${order.Status}</span>
                </div>
                <div class="order-items">
                    ${order.order_details.map(detail => `
                        <div class="order-item">
                            <img src="${detail.ImageURL}" alt="${detail.ProductName}" class="item-image">
                            <div class="item-details">
                                <span class="item-name">${detail.ProductName}</span>
                                <span class="item-price">${detail.Quantity} x ${Number(detail.PriceAtPurchase).toLocaleString('vi-VN')}₫</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="order-footer">
                    <span class="order-total">Tổng tiền: ${calculateOrderTotal(order.order_details).toLocaleString('vi-VN')}₫</span>
                </div>
            </div>
        `;
        orderListEl.innerHTML += orderHtml;
    });
}

function calculateOrderTotal(orderDetails) {
    return orderDetails.reduce((total, item) => total + (item.Quantity * item.PriceAtPurchase), 0);
}