// File: assets/js/home.js

let allProductsData = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadAndRenderAllProducts();
    await renderUserActions();
    filterProducts('all');

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', e => handleSearch(e.target.value));
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch('api/auth/logout.php');
                window.location.href = 'home.html';
            } catch {
                alert('Lỗi khi đăng xuất.');
            }
        });
    }

    const categoryFilters = document.querySelector('.category-filters');
    if (categoryFilters) {
        categoryFilters.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-filter]');
            if (!button) return;

            categoryFilters.querySelectorAll('button').forEach(btn => btn.classList.remove('active', 'btn-dark'));
            button.classList.add('active', 'btn-dark');

            filterProducts(button.dataset.filter);
        });
    }

    const menuDropdown = document.querySelector('.nav-item.dropdown');
    if (menuDropdown) {
        menuDropdown.addEventListener('click', (e) => {
            const dropdownItem = e.target.closest('.dropdown-item');
            if (!dropdownItem) return;

            const filter = dropdownItem.dataset.filter;
            filterProducts(filter);

            document.querySelectorAll('.category-filters button').forEach(btn => {
                btn.classList.remove('active', 'btn-dark', 'btn-outline-secondary');
                btn.classList.add('btn-outline-secondary');
                if (btn.dataset.filter === filter) {
                    btn.classList.add('active', 'btn-dark');
                    btn.classList.remove('btn-outline-secondary');
                }
            });
        });
    }
});

async function loadAndRenderAllProducts() {
    try {
        const response = await fetch('api/products/read.php');
        allProductsData = await response.json();
        renderProductsByCategory(allProductsData);
    } catch {
        const mainDishesGrid = document.getElementById('main-dishes-grid');
        if (mainDishesGrid) {
            mainDishesGrid.innerHTML = '<p class="col-12 text-center text-danger">Không tải được sản phẩm.</p>';
        }
    }
}

function renderProductsByCategory(products) {
    const categories = {
        'main-dishes-grid': 'Món chính',
        'snacks-grid': 'Đồ ăn nhẹ',
        'vegetarian-dishes-grid': 'Các món chay',
        'desserts-grid': 'Tráng miệng',
        'drinks-grid': 'Đồ uống'
    };

    for (const [containerId, categoryName] of Object.entries(categories)) {
        const filtered = products.filter(p => p.Category === categoryName);
        renderProductSection(containerId, filtered);
    }

    initAddToCartListeners();
    initBuyNowListeners();
}

function renderProductSection(containerId, products) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = products.length === 0
        ? '<p class="col-12 text-center text-muted">Chưa có sản phẩm nào.</p>'
        : products.map(product => `
            <div class="col">
                <div class="card product-card">
                    <div class="product-image-wrapper">
                        <img src="${product.ImageURL}" class="card-img-top" alt="${product.ProductName}">
                        <div class="product-description-hover">
                            <p>${product.Description || 'Không có mô tả.'}</p>
                        </div>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${product.ProductName}</h5>
                        <p class="card-text small text-muted">${product.Category}</p>
                        <div class="mt-auto">
                            <span class="price d-block mb-2">${Number(product.Price).toLocaleString('vi-VN')}₫</span>
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary add-to-cart" data-id="${product.ProductID}">Thêm vào giỏ</button>
                                <button class="btn btn-outline-secondary buy-now" data-id="${product.ProductID}">Mua ngay</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
}

function filterProducts(filter) {
    document.querySelectorAll('main section').forEach(section => {
        const sectionId = section.id.replace('-section', '');
        section.style.display = (filter === 'all' || sectionId === filter) ? 'block' : 'none';
    });
}

function handleSearch(searchTerm) {
    const normalized = searchTerm.trim().toLowerCase();
    document.querySelectorAll('main section').forEach(s => s.style.display = 'none');

    const filtered = allProductsData.filter(product =>
        product.ProductName.toLowerCase().startsWith(normalized)
    );

    let resultSection = document.getElementById('search-results-section');
    if (!resultSection) {
        resultSection = document.createElement('section');
        resultSection.id = 'search-results-section';
        resultSection.classList.add('mb-5');
        document.querySelector('main').appendChild(resultSection);
    }

    resultSection.innerHTML = `
        <h2 class="mb-4">Kết quả tìm kiếm</h2>
        <div id="search-results-grid" class="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4"></div>
    `;

    if (filtered.length > 0) {
        renderProductSection('search-results-grid', filtered);
        initAddToCartListeners();
        initBuyNowListeners();
    } else {
        document.getElementById('search-results-grid').innerHTML = '<p class="col-12 text-center text-muted">Không tìm thấy sản phẩm nào.</p>';
    }

    if (normalized === '') {
        filterProducts('all');
        resultSection.style.display = 'none';
    } else {
        resultSection.style.display = 'block';
        document.querySelectorAll('.category-filters button').forEach(btn => btn.classList.remove('active', 'btn-dark'));
    }
}

async function getCartCount() {
    try {
        const res = await fetch('api/auth/session.php');
        const data = await res.json();
        return (data.loggedIn && data.cartCount) ? data.cartCount : 0;
    } catch {
        return 0;
    }
}

async function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const count = await getCartCount();
        cartCountElement.textContent = count;
    }
}

async function renderUserActions() {
    const div = document.getElementById('user-actions');
    if (!div) return;

    try {
        const res = await fetch('api/auth/session.php');
        const data = await res.json();

        if (data.loggedIn && data.user) {
            div.innerHTML = `
                <div class="cart-dropdown-container">
                    <a href="cart.html" class="btn btn-dark rounded-pill me-2 cart-icon-btn">
                        <i class="bi bi-cart3"></i> Giỏ hàng <span id="cart-count" class="badge bg-danger">${data.cartCount || 0}</span>
                    </a>
                    <div id="mini-cart-content" class="mini-cart-dropdown">
                        <div class="mini-cart-header">
                            <h5>Giỏ hàng của bạn</h5>
                        </div>
                        <div id="mini-cart-items-list" class="mini-cart-items">
                        </div>
                        <div class="mini-cart-footer">
                            <a href="cart.html" class="btn btn-primary w-100">Xem giỏ hàng</a>
                        </div>
                    </div>
                </div>
                <div class="dropdown">
                    <a href="#" class="profile-icon ms-3 d-flex align-items-center text-dark text-decoration-none dropdown-toggle" id="profileDropdown" data-bs-toggle="dropdown">
                        <i class="bi bi-person-circle fs-4 me-2"></i>
                        <strong>${data.user.fullname}</strong>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end shadow">
                        <li><h6 class="dropdown-header">${data.user.phone || 'Chưa có SĐT'}</h6></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="${data.user.role === 'customer' ? 'profile.html' : (data.user.role === 'Shipper' ? 'shipper.html' : 'admin.html')}">Thông tin cá nhân</a></li>
                        ${data.user.role === 'customer' ? '<li><a class="dropdown-item" href="order_history.html">Lịch sử đơn hàng</a></li>' : ''}
                        <li><hr class="dropdown-divider"></li>
                        <li><button class="dropdown-item" id="logout-btn">Đăng xuất</button></li>
                    </ul>
                </div>`;

            document.getElementById('logout-btn').addEventListener('click', async () => {
                await fetch('api/auth/logout.php');
                window.location.href = 'home.html';
            });

            const cartDropdownContainer = document.querySelector('.cart-dropdown-container');
            const miniCartDropdown = document.getElementById('mini-cart-content');

            cartDropdownContainer.addEventListener('mouseenter', () => {
                miniCartDropdown.style.display = 'block';
                renderMiniCart();
            });

            cartDropdownContainer.addEventListener('mouseleave', () => {
                miniCartDropdown.style.display = 'none';
            });

            await updateCartCount();
        } else {
            div.innerHTML = `
                <a href="register.html" class="btn btn-dark rounded-pill me-2">Đăng ký</a>
                <a href="login.html" class="btn btn-outline-dark rounded-pill me-2">Đăng nhập</a>`;

            await updateCartCount();
        }
    } catch {
        div.innerHTML = `
            <a href="register.html" class="btn btn-dark rounded-pill me-2">Đăng ký</a>
            <a href="login.html" class="btn btn-outline-dark rounded-pill me-2">Đăng nhập</a>`;

        await updateCartCount();
    }
}

async function renderMiniCart() {
    const miniCartItemsList = document.getElementById('mini-cart-items-list');
    if (!miniCartItemsList) return;

    miniCartItemsList.innerHTML = '<div class="text-center p-3"><div class="spinner-border spinner-border-sm" role="status"></div></div>';

    try {
        const response = await fetch('api/cart/read.php');
        const cartData = await response.json();

        if (cartData.success && cartData.cartItems.length > 0) {
            const cartHtml = cartData.cartItems.map(item => `
                <div class="mini-cart-item">
                    <img src="${item.ImageURL}" alt="${item.ProductName}" class="mini-cart-item-image">
                    <div class="mini-cart-item-details">
                        <span class="mini-cart-item-name">${item.ProductName}</span>
                        <span class="mini-cart-item-quantity">x${item.Quantity}</span>
                    </div>
                    <span class="mini-cart-item-price">${Number(item.Price).toLocaleString('vi-VN')}₫</span>
                </div>
            `).join('');
            miniCartItemsList.innerHTML = cartHtml;
        } else {
            miniCartItemsList.innerHTML = '<p class="text-center text-muted p-3">Giỏ hàng trống.</p>';
        }
    } catch (error) {
        miniCartItemsList.innerHTML = '<p class="text-center text-danger p-3">Lỗi tải giỏ hàng.</p>';
    }
}

function initAddToCartListeners() {
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', async (e) => {
            const productId = e.currentTarget.dataset.id;

            if (!productId) {
                alert('Không tìm thấy ID sản phẩm.');
                return;
            }

            try {
                const session = await fetch('api/auth/session.php');
                const sessionData = await session.json();

                if (sessionData.loggedIn) {
                    await addToCart(productId);
                } else {
                    alert('Vui lòng đăng nhập trước.');
                    window.location.href = 'login.html';
                }
            } catch (err) {
                alert('Lỗi khi kiểm tra phiên đăng nhập.');
            }
        });
    });
}

function initBuyNowListeners() {
    document.querySelectorAll('.buy-now').forEach(button => {
        button.addEventListener('click', async (e) => {
            const productId = e.currentTarget.dataset.id;
            if (!productId) {
                alert('Không tìm thấy ID sản phẩm.');
                return;
            }

            try {
                const session = await fetch('api/auth/session.php');
                const sessionData = await session.json();

                if (!sessionData.loggedIn) {
                    // Dùng điều hướng thay vì alert/confirm mặc định
                    window.location.href = 'login.html';
                    return;
                }

                // Thêm vào giỏ ở chế độ im lặng (không alert)
                const added = await addToCart(productId, false);
                if (added) {
                    openBuyNowModal();
                }
            } catch (err) {
                // Không dùng alert để tránh popup mặc định
                console.error('Lỗi buy-now:', err);
            }
        });
    });
}

let buyNowModalInstance = null;

function ensureBuyNowModal() {
    let modal = document.getElementById('buyNowModal');
    if (!modal) {
        const modalHtml = `
<div class="modal fade" id="buyNowModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Xác nhận thanh toán</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body" id="buy-now-modal-body">
        Bạn có chắc chắn muốn thanh toán đơn hàng này không?
      </div>
      <div class="modal-footer" id="buy-now-modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
        <button type="button" class="btn btn-primary" id="buy-now-confirm-btn">Xác nhận</button>
      </div>
    </div>
  </div>
</div>`;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = modalHtml;
        document.body.appendChild(wrapper.firstElementChild);
        modal = document.getElementById('buyNowModal');
    }
    if (!buyNowModalInstance) {
        // eslint-disable-next-line no-undef
        buyNowModalInstance = new bootstrap.Modal(modal);
    }
    return modal;
}

function openBuyNowModal() {
    const modal = ensureBuyNowModal();
    const bodyEl = document.getElementById('buy-now-modal-body');
    const footerEl = document.getElementById('buy-now-modal-footer');
    const confirmBtn = document.getElementById('buy-now-confirm-btn');

    // Reset nội dung modal mỗi lần mở
    if (bodyEl) bodyEl.textContent = 'Bạn có chắc chắn muốn thanh toán đơn hàng này không?';
    if (footerEl) footerEl.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
        <button type="button" class="btn btn-primary" id="buy-now-confirm-btn">Xác nhận</button>
    `;

    // Gắn lại handler xác nhận (one-time)
    const newConfirmBtn = document.getElementById('buy-now-confirm-btn');
    if (newConfirmBtn) {
        newConfirmBtn.addEventListener('click', async () => {
            await checkoutViaModal();
        }, { once: true });
    }

    buyNowModalInstance.show();
}

async function checkoutViaModal() {
    const bodyEl = document.getElementById('buy-now-modal-body');
    const footerEl = document.getElementById('buy-now-modal-footer');

    if (bodyEl) {
        bodyEl.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                <div class="spinner-border spinner-border-sm" role="status"></div>
                <span>Đang xử lý thanh toán...</span>
            </div>
        `;
    }
    if (footerEl) footerEl.innerHTML = '';

    try {
        const response = await fetch('api/cart/checkout.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const result = await response.json();

        if (bodyEl) bodyEl.textContent = result.message || 'Đã xử lý xong.';
        if (footerEl) {
            footerEl.innerHTML = `
                <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Đóng</button>
                ${result.success ? '<a href="order_history.html" class="btn btn-outline-primary">Xem đơn hàng</a>' : ''}
            `;
        }

        if (result.success) {
            await updateCartCount();
            await renderMiniCart();
        }
    } catch (error) {
        if (bodyEl) bodyEl.textContent = 'Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.';
        if (footerEl) footerEl.innerHTML = '<button type="button" class="btn btn-primary" data-bs-dismiss="modal">Đóng</button>';
        console.error('Lỗi khi thanh toán:', error);
    }
}

async function addToCart(productId, showFeedback = true) {
    try {
        const response = await fetch('api/cart/add.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId })
        });
        const result = await response.json();
        if (showFeedback) {
            alert(result.message);
        }

        if (result.success) {
            await updateCartCount();
            await renderMiniCart();
            return true;
        }
        return false;
    } catch (err) {
        if (showFeedback) {
            alert('Lỗi khi thêm vào giỏ.');
        } else {
            console.error('Lỗi khi thêm vào giỏ:', err);
        }
        return false;
    }
}
