// File: assets/js/cart.js

document.addEventListener('DOMContentLoaded', async () => {

    const cartItemsList = document.getElementById('cart-items-list');
    const subtotalElement = document.getElementById('subtotal');
    const shippingFeeElement = document.getElementById('shipping-fee');
    const totalPriceElement = document.getElementById('total-price');
    const checkoutButton = document.getElementById('checkout-button');

    if (!cartItemsList || !subtotalElement || !shippingFeeElement || !totalPriceElement || !checkoutButton) {
        return;
    }

    await displayCart();

    cartItemsList.addEventListener('click', async (e) => {
        const removeBtn = e.target.closest('.remove-item-btn');
        const increaseBtn = e.target.closest('.quantity-btn[data-action="increase"]');
        const decreaseBtn = e.target.closest('.quantity-btn[data-action="decrease"]');

        if (removeBtn) {
            const cartItemId = removeBtn.dataset.id;
            if (confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) {
                await removeFromCart(cartItemId);
            }
        }
        
        if (increaseBtn) {
            const cartItemId = increaseBtn.dataset.id;
            const currentQuantity = parseInt(document.getElementById(`quantity-${cartItemId}`).value);
            await updateCartQuantity(cartItemId, currentQuantity + 1);
        }
        
        if (decreaseBtn) {
            const cartItemId = decreaseBtn.dataset.id;
            const currentQuantity = parseInt(document.getElementById(`quantity-${cartItemId}`).value);
            
            if (currentQuantity > 1) {
                await updateCartQuantity(cartItemId, currentQuantity - 1);
            } else {
                if (confirm('Bạn có muốn xóa sản phẩm này khỏi giỏ hàng?')) {
                    await removeFromCart(cartItemId);
                }
            }
        }
    });

    cartItemsList.addEventListener('change', async (e) => {
        const quantityInput = e.target.closest('.item-quantity');
        if (quantityInput) {
            const cartItemId = quantityInput.dataset.id;
            const newQuantity = parseInt(quantityInput.value);
            if (newQuantity > 0) {
                await updateCartQuantity(cartItemId, newQuantity);
            } else {
                if (confirm('Bạn có muốn xóa sản phẩm này khỏi giỏ hàng?')) {
                    await removeFromCart(cartItemId);
                } else {
                    await displayCart();
                }
            }
        }
    });

    checkoutButton.addEventListener('click', async () => {
        if (confirm('Bạn có chắc chắn muốn thanh toán đơn hàng này không?')) {
            await checkout();
        }
    });

    async function displayCart() {
        cartItemsList.innerHTML = '<div class="text-center py-5"><div class="spinner-border" role="status"></div></div>';

        try {
            const response = await fetch('api/cart/read.php');
            const cartData = await response.json();

            if (cartData.success && cartData.cartItems.length > 0) {
                let totalAmount = 0;
                const cartHtml = cartData.cartItems.map(item => {
                    const itemTotal = item.Quantity * item.Price;
                    totalAmount += itemTotal;
                    return `
                        <div class="cart-item">
                            <div class="item-main-info">
                                <img src="${item.ImageURL}" alt="${item.ProductName}" class="item-image">
                                <div class="item-details">
                                    <h4>${item.ProductName}</h4>
                                    <span class="item-price">${Number(item.Price).toLocaleString('vi-VN')}₫</span>
                                </div>
                            </div>
                            <div class="item-actions">
                                <div class="quantity-control">
                                    <button class="quantity-btn" data-id="${item.CartItemID}" data-action="decrease">-</button>
                                    <input type="number" class="item-quantity" id="quantity-${item.CartItemID}" value="${item.Quantity}" min="1" data-id="${item.CartItemID}">
                                    <button class="quantity-btn" data-id="${item.CartItemID}" data-action="increase">+</button>
                                </div>
                                <button class="remove-item-btn" data-id="${item.CartItemID}" title="Xóa">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');

                cartItemsList.innerHTML = cartHtml;
                subtotalElement.textContent = `${Number(totalAmount).toLocaleString('vi-VN')}₫`;
                shippingFeeElement.textContent = `20.000₫`; // phí ship cố định
                totalPriceElement.textContent = `${Number(totalAmount + 20000).toLocaleString('vi-VN')}₫`;
                checkoutButton.disabled = false;
            } else {
                cartItemsList.innerHTML = `
                    <div class="empty-cart-message">
                        <i class="bi bi-emoji-dizzy"></i>
                        <p>Giỏ hàng của bạn đang trống.</p>
                        <a href="home.html" class="btn-primary-ghost">Tiếp tục mua sắm</a>
                    </div>
                `;
                subtotalElement.textContent = '0₫';
                shippingFeeElement.textContent = '0₫';
                totalPriceElement.textContent = '0₫';
                checkoutButton.disabled = true;
            }
        } catch (error) {
            console.error('Lỗi hiển thị giỏ hàng:', error);
            cartItemsList.innerHTML = '<div class="alert alert-danger text-center">Không thể tải giỏ hàng.</div>';
        }
    }

    async function removeFromCart(cartItemId) {
        try {
            const response = await fetch('api/cart/remove.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartItemId })
            });
            const result = await response.json();
            alert(result.message);
            if (result.success) {
                await displayCart();
                if (window.updateCartCount) updateCartCount();
            }
        } catch (error) {
            console.error('Lỗi khi xóa khỏi giỏ hàng:', error);
            alert('Đã có lỗi xảy ra. Vui lòng thử lại.');
        }
    }

    async function updateCartQuantity(cartItemId, quantity) {
        try {
            const response = await fetch('api/cart/update_quantity.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartItemId, quantity })
            });
            const result = await response.json();
            if (result.success) {
                await displayCart();
                if (window.updateCartCount) updateCartCount();
            } else {
                alert('Lỗi: ' + result.message);
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật số lượng:', error);
            alert('Đã có lỗi xảy ra. Vui lòng thử lại.');
        }
    }
    
    // Thêm hàm checkout mới
    async function checkout() {
        try {
            const response = await fetch('api/cart/checkout.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const result = await response.json();
            alert(result.message);

            if (result.success) {
                await displayCart();
                if (window.updateCartCount) updateCartCount();
            }
        } catch (error) {
            console.error('Lỗi khi thanh toán:', error);
            alert('Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.');
        }
    }
});