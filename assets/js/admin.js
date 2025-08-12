// Biến toàn cục để lưu trữ dữ liệu, tránh gọi API nhiều lần không cần thiết
let allProductsData = [];
let allEmployeesData = [];

// Chạy code sau khi toàn bộ cây HTML đã được tải xong
document.addEventListener('DOMContentLoaded', async () => {
    
    // ======================================================
    // BƯỚC 1: KIỂM TRA PHIÊN ĐĂNG NHẬP
    // ======================================================
    try {
        const response = await fetch('api/auth/session.php');
        const data = await response.json();
        if (!data.loggedIn || (data.user.role !== 'admin' && data.user.role !== 'employee')) {
            alert('Bạn không có quyền truy cập trang này. Vui lòng đăng nhập.');
            window.location.href = 'login.html';
            return;
        }
        document.getElementById('admin-fullname').textContent = data.user.fullname;
    } catch (error) {
        console.error('Lỗi kiểm tra session:', error);
        window.location.href = 'login.html';
    }

    // ======================================================
    // BƯỚC 2: XỬ LÝ SỰ KIỆN CHUNG
    // ======================================================

    // --- Xử lý điều hướng Sidebar ---
    const sidebar = document.querySelector('.admin-sidebar');
    sidebar.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-section]');
        if (!button) return;

        sidebar.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const section = button.dataset.section;
        switch (section) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'products':
                loadProducts();
                break;
            case 'employees':
                loadEmployees();
                break;
            case 'customers':
                loadCustomers();
                break;
            case 'orders':
                loadOrders();
                break;
            case 'revenue':
                loadRevenue();
                break;
            default:
                document.getElementById('admin-page-title').textContent = 'Mục không xác định';
                document.getElementById('admin-page-content').innerHTML = '<p>Chức năng này đang được phát triển.</p>';
        }
    });

    // --- Xử lý nút Đăng xuất ---
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await fetch('api/auth/logout.php');
        window.location.href = 'login.html';
    });

    // --- (SỬA LỖI) GỘP CHUNG TRÌNH XỬ LÝ SỰ KIỆN CLICK ---
    document.getElementById('admin-page-content').addEventListener('click', (e) => {
        // Xử lý cho SẢN PHẨM
        const addProductBtn = e.target.closest('#addProductBtn');
        const editProductBtn = e.target.closest('.btn-edit-product');
        const deleteProductBtn = e.target.closest('.btn-delete-product');

        if (addProductBtn) showProductModal();
        if (editProductBtn) editProduct(editProductBtn.dataset.id);
        if (deleteProductBtn) {
            if (confirm(`Bạn có chắc muốn xóa sản phẩm ID: ${deleteProductBtn.dataset.id}?`)) {
                deleteProduct(deleteProductBtn.dataset.id);
            }
        }
        
        // Xử lý cho NHÂN VIÊN
        const addEmployeeBtn = e.target.closest('#addEmployeeBtn');
        const editEmployeeBtn = e.target.closest('.btn-edit-employee');
        const deleteEmployeeBtn = e.target.closest('.btn-delete-employee');
        
        if (addEmployeeBtn) showEmployeeModal();
        if (editEmployeeBtn) editEmployee(editEmployeeBtn.dataset.id);
        if (deleteEmployeeBtn) {
             if (confirm(`Bạn có chắc muốn xóa nhân viên ID: ${deleteEmployeeBtn.dataset.id}?`)) {
                deleteEmployee(deleteEmployeeBtn.dataset.id);
            }
        }
    });

    // --- Xử lý sự kiện submit cho cả 2 form ---
    document.getElementById('productForm').addEventListener('submit', (event) => {
        handleProductFormSubmit.call(event.currentTarget, event);
    });
    document.getElementById('employeeForm').addEventListener('submit', (event) => {
        handleEmployeeFormSubmit.call(event.currentTarget, event);
    });
    
    // Tải bảng điều khiển làm trang mặc định
    loadDashboard();
});


// ======================================================
// CÁC HÀM TẢI NỘI DUNG (LOADERS)
// ======================================================

function loadDashboard() {
    document.getElementById('admin-page-title').textContent = 'Bảng điều khiển';
    document.getElementById('admin-page-content').innerHTML = '<p>Chào mừng đến với trang quản trị FoodDev.</p>';
}

async function loadProducts() {
    const pageTitle = document.getElementById('admin-page-title');
    const contentArea = document.getElementById('admin-page-content');
    
    pageTitle.textContent = 'Quản lý Sản phẩm';
    contentArea.innerHTML = '<div class="d-flex justify-content-center mt-5"><div class="spinner-border" role="status"></div></div>';

    try {
        const response = await fetch('api/products/read.php');
        allProductsData = await response.json();

        const productsByCategory = allProductsData.reduce((acc, product) => {
            const category = product.Category || 'Chưa phân loại';
            if (!acc[category]) acc[category] = [];
            acc[category].push(product);
            return acc;
        }, {});
        
        let finalHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="m-0">Danh sách sản phẩm</h2>
                <button class="btn btn-success" id="addProductBtn">
                    <i class="bi bi-plus-circle-fill me-2"></i>Thêm sản phẩm
                </button>
            </div>
        `;
        const categories = ['Món chính', 'Đồ ăn nhẹ', 'Các món chay', 'Tráng miệng', 'Đồ uống'];

        categories.forEach(category => {
            finalHTML += `
                <div class="product-category-container mb-4">
                    <h4 class="product-category-header">${category}</h4>
                    <div class="table-responsive">
                        <table class="table table-bordered table-hover align-middle">
                            <thead class="table-light">
                                <tr>
                                    <th style="width: 30%;">Tên món</th>
                                    <th style="width: 15%;">Giá</th>
                                    <th>Mô tả</th>
                                    <th style="width: 15%;">Hình ảnh</th>
                                    <th style="width: 15%;" class="text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>`;
            
            const categoryProducts = productsByCategory[category] || [];
            if (categoryProducts.length > 0) {
                categoryProducts.forEach(product => {
                    finalHTML += `
                        <tr>
                            <td>${product.ProductName}</td>
                            <td>${Number(product.Price).toLocaleString('vi-VN')}đ</td>
                            <td>${product.Description || '<em>Không có mô tả</em>'}</td>
                            <td><img src="${product.ImageURL}" alt="${product.ProductName}" class="table-image"></td>
                            <td class="text-center">
                                <button class="btn btn-sm btn-warning btn-edit-product" data-id="${product.ProductID}" title="Sửa"><i class="bi bi-pencil-fill"></i></button>
                                <button class="btn btn-sm btn-danger btn-delete-product" data-id="${product.ProductID}" title="Xóa"><i class="bi bi-trash-fill"></i></button>
                            </td>
                        </tr>`;
                });
            } else {
                finalHTML += '<tr><td colspan="5" class="text-center text-muted">Chưa có sản phẩm nào</td></tr>';
            }
            finalHTML += '</tbody></table></div></div>';
        });
        contentArea.innerHTML = finalHTML;

    } catch (error) {
        console.error('Lỗi tải sản phẩm:', error);
        contentArea.innerHTML = '<div class="alert alert-danger">Không thể tải dữ liệu sản phẩm.</div>';
    }
}

async function loadEmployees() {
    const pageTitle = document.getElementById('admin-page-title');
    const contentArea = document.getElementById('admin-page-content');
    
    pageTitle.textContent = 'Quản lý Nhân viên';
    contentArea.innerHTML = '<div class="d-flex justify-content-center mt-5"><div class="spinner-border" role="status"></div></div>';

    try {
        const response = await fetch('api/employees/read.php');
        allEmployeesData = await response.json();

        const restaurantStaff = allEmployeesData.filter(e => e.Role === 'Restaurant');
        const shippers = allEmployeesData.filter(e => e.Role === 'Shipper');

        contentArea.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="m-0">Danh sách nhân viên</h2>
                <button class="btn btn-success" id="addEmployeeBtn">
                    <i class="bi bi-plus-circle-fill me-2"></i>Thêm nhân viên
                </button>
            </div>
            ${createEmployeeTableHTML('Nhân viên Nhà hàng', restaurantStaff)}
            ${createEmployeeTableHTML('Shipper', shippers)}
        `;
    } catch (error) {
        console.error('Lỗi tải nhân viên:', error);
        contentArea.innerHTML = '<div class="alert alert-danger">Không thể tải dữ liệu nhân viên.</div>';
    }
}


// ======================================================
// CÁC HÀM HỖ TRỢ CHO QUẢN LÝ SẢN PHẨM
// ======================================================

function showProductModal(product = null) {
    const modalElement = document.getElementById('productModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    const form = document.getElementById('productForm');
    const modalLabel = document.getElementById('productModalLabel');
    const imagePreview = document.getElementById('imagePreview');

    form.reset();
    imagePreview.innerHTML = '';
    
    if (product) {
        modalLabel.textContent = `Chỉnh sửa sản phẩm: ${product.ProductName}`;
        document.getElementById('productId').value = product.ProductID;
        document.getElementById('productName').value = product.ProductName;
        document.getElementById('productCategory').value = product.Category;
        document.getElementById('productDescription').value = product.Description;
        document.getElementById('productPrice').value = product.Price;
        if(product.ImageURL) {
            imagePreview.innerHTML = `<p class="mb-1">Ảnh hiện tại:</p><img src="${product.ImageURL}" class="img-thumbnail" width="100">`;
        }
    } else {
        modalLabel.textContent = 'Thêm sản phẩm mới';
        document.getElementById('productId').value = '';
    }
    modal.show();
}

function editProduct(id) {
    const product = allProductsData.find(p => p.ProductID == id);
    if (product) {
        showProductModal(product);
    } else {
        alert('Không tìm thấy sản phẩm.');
    }
}

async function handleProductFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const id = formData.get('id');
    const url = id ? 'api/products/update.php' : 'api/products/create.php';

    try {
        const response = await fetch(url, { method: 'POST', body: formData });
        const result = await response.json();
        if(result.success) {
            alert(result.message);
            bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
            loadProducts();
        } else {
            alert('Lỗi: ' + (result.message || 'Không thể thực hiện yêu cầu.'));
        }
    } catch(error) {
        console.error('Lỗi khi gửi form:', error);
        alert('Đã có lỗi kết nối xảy ra.');
    }
}

async function deleteProduct(id) {
    try {
        const response = await fetch('api/products/delete.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        const result = await response.json();
        if(result.success) {
            alert(result.message);
            loadProducts();
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error);
        alert('Đã có lỗi kết nối xảy ra.');
    }
}


// ======================================================
// CÁC HÀM HỖ TRỢ CHO QUẢN LÝ NHÂN VIÊN
// ======================================================

function createEmployeeTableHTML(title, employees) {
    let tableRows = '';
    if (employees.length > 0) {
        employees.forEach(emp => {
            tableRows += `
                <tr>
                    <td>${emp.EmployeeID}</td>
                    <td>${emp.FullName}</td>
                    <td>${emp.Email}</td>
                    <td>${emp.PhoneNumber}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn_WARNING btn-edit-employee" data-id="${emp.EmployeeID}" title="Sửa"><i class="bi bi-pencil-fill"></i></button>
                        <button class="btn btn-sm btn-danger btn-delete-employee" data-id="${emp.EmployeeID}" title="Xóa"><i class="bi bi-trash-fill"></i></button>
                    </td>
                </tr>
            `;
        });
    } else {
        tableRows = '<tr><td colspan="5" class="text-center text-muted">Chưa có nhân viên nào</td></tr>';
    }

    return `
        <div class="product-category-container mb-4">
            <h4 class="product-category-header">${title}</h4>
            <div class="table-responsive">
                <table class="table table-bordered table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>ID</th>
                            <th>Họ tên</th>
                            <th>Email</th>
                            <th>SĐT</th>
                            <th class="text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
        </div>
    `;
}

function showEmployeeModal(employee = null) {
    const modalElement = document.getElementById('employeeModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    const form = document.getElementById('employeeForm');
    const modalLabel = document.getElementById('employeeModalLabel');
    const passwordInput = document.getElementById('employeePassword');
    
    form.reset();

    if (employee) {
        modalLabel.textContent = `Chỉnh sửa nhân viên: ${employee.FullName}`;
        passwordInput.required = false;
        passwordInput.placeholder = "Để trống nếu không đổi";
        document.getElementById('employeeId').value = employee.EmployeeID;
        document.getElementById('employeeFullName').value = employee.FullName;
        document.getElementById('employeeEmail').value = employee.Email;
        document.getElementById('employeePhone').value = employee.PhoneNumber;
        document.getElementById('employeeRole').value = employee.Role;
    } else {
        modalLabel.textContent = 'Thêm nhân viên mới';
        passwordInput.required = true;
        passwordInput.placeholder = "Nhập mật khẩu...";
        document.getElementById('employeeId').value = '';
    }
    modal.show();
}

function editEmployee(id) {
    const employee = allEmployeesData.find(e => e.EmployeeID == id);
    if (employee) {
        showEmployeeModal(employee);
    } else {
        alert('Không tìm thấy nhân viên.');
    }
}

async function handleEmployeeFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const id = formData.get('id');
    const password = formData.get('Password');
    const url = id ? 'api/employees/update.php' : 'api/employees/create.php';

    const isUpdatingWithoutPassword = id && password === '';
    
    if (!isUpdatingWithoutPassword) { 
        const passwordPattern = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?!.*\s).{8,}$/;
        if (!passwordPattern.test(password)) {
            alert("Mật khẩu không hợp lệ!\n\nMật khẩu phải có:\n- Ít nhất 8 ký tự\n- Ít nhất 1 chữ IN HOA\n- Ít nhất 1 chữ số (0-9)\n- Ít nhất 1 ký tự đặc biệt (!@#$%^&*)\n- Không chứa khoảng trắng");
            return;
        }
    }
    
    if (isUpdatingWithoutPassword) {
        formData.delete('Password');
    }

    try {
        const response = await fetch(url, { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            bootstrap.Modal.getInstance(document.getElementById('employeeModal')).hide();
            loadEmployees();
        } else {
            alert('Lỗi: ' + (result.message || 'Yêu cầu không thành công'));
        }
    } catch (error) {
        console.error('Lỗi khi submit form nhân viên:', error);
        alert('Đã có lỗi kết nối xảy ra.');
    }
}

async function deleteEmployee(id) {
    try {
        const response = await fetch('api/employees/delete.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            loadEmployees();
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi khi xóa nhân viên:', error);
        alert('Đã có lỗi kết nối xảy ra.');
    }
}

// ======================================================
// CÁC HÀM HỖ TRỢ CHO QUẢN LÝ NHÂN VIÊN
// ======================================================


async function loadCustomers() {
    const pageTitle = document.getElementById('admin-page-title');
    const contentArea = document.getElementById('admin-page-content');

    pageTitle.textContent = 'Quản lý Khách hàng';
    contentArea.innerHTML = '<div class="d-flex justify-content-center mt-5"><div class="spinner-border" role="status"></div></div>';

    try {
        const response = await fetch('api/customers/read.php');
        const allCustomersData = await response.json();

        let finalHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="m-0">Danh sách khách hàng</h2>
            </div>
            <div class="table-responsive">
                <table class="table table-bordered table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th style="width: 5%;">ID</th>
                            <th style="width: 20%;">Họ tên</th>
                            <th style="width: 20%;">Email</th>
                            <th style="width: 15%;">Số điện thoại</th>
                            <th style="width: 40%;">Địa chỉ</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (allCustomersData.length > 0) {
            allCustomersData.forEach(customer => {
                finalHTML += `
                    <tr>
                        <td>${customer.CustomerID}</td>
                        <td>${customer.FullName}</td>
                        <td>${customer.Email}</td>
                        <td>${customer.PhoneNumber || '<em>Chưa cập nhật</em>'}</td>
                        <td>${customer.Address || '<em>Chưa cập nhật</em>'}</td>
                    </tr>
                `;
            });
        } else {
            finalHTML += '<tr><td colspan="5" class="text-center text-muted">Chưa có khách hàng nào</td></tr>';
        }
        finalHTML += `
                    </tbody>
                </table>
            </div>
        `;
        contentArea.innerHTML = finalHTML;

    } catch (error) {
        console.error('Lỗi tải khách hàng:', error);
        contentArea.innerHTML = '<div class="alert alert-danger">Không thể tải dữ liệu khách hàng.</div>';
    }
}

// =============================
// QUẢN LÝ ĐƠN HÀNG (ADMIN)
// =============================
async function loadOrders() {
    const pageTitle = document.getElementById('admin-page-title');
    const contentArea = document.getElementById('admin-page-content');

    pageTitle.textContent = 'Quản lý Đơn hàng';
    contentArea.innerHTML = '<div class="d-flex justify-content-center mt-5"><div class="spinner-border" role="status"></div></div>';

    try {
        const response = await fetch('api/orders/read.php');
        const result = await response.json();

        if (!result.success) {
            contentArea.innerHTML = `<div class="alert alert-danger">${result.message || 'Không thể tải dữ liệu đơn hàng.'}</div>`;
            return;
        }

        const orders = result.orders || [];

        let tableRows = '';
        if (orders.length > 0) {
            orders.forEach(order => {
                const totalVnd = Number(order.OrderTotal || 0).toLocaleString('vi-VN');
                tableRows += `
                    <tr>
                        <td>${order.OrderID}</td>
                        <td>${order.CustomerName || '<em>Khách lẻ</em>'}</td>
                        <td>${order.OrderDate}</td>
                        <td><span class="badge bg-${order.Status === 'Chờ xác nhận' ? 'warning' : 'success'}">${order.Status || 'N/A'}</span></td>
                        <td class="text-end">${totalVnd}đ</td>
                        <td class="text-center">${order.ItemCount || 0}</td>
                    </tr>
                `;
            });
        } else {
            tableRows = '<tr><td colspan="6" class="text-center text-muted">Chưa có đơn hàng nào</td></tr>';
        }

        contentArea.innerHTML = `
            <div class="d-flex justify-content_between align-items-center mb-4">
                <h2 class="m-0">Danh sách đơn hàng</h2>
            </div>
            <div class="table-responsive">
                <table class="table table-bordered table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th style="width: 8%;">Mã ĐH</th>
                            <th style="width: 22%;">Khách hàng</th>
                            <th style="width: 18%;">Ngày đặt</th>
                            <th style="width: 14%;">Trạng thái</th>
                            <th style="width: 18%;" class="text-end">Tổng tiền</th>
                            <th style="width: 10%;" class="text-center">Số món</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Lỗi tải đơn hàng:', error);
        contentArea.innerHTML = '<div class="alert alert-danger">Không thể tải dữ liệu đơn hàng.</div>';
    }
}

// =============================
// THỐNG KÊ DOANH THU (ADMIN)
// =============================
async function loadRevenue() {
    const pageTitle = document.getElementById('admin-page-title');
    const contentArea = document.getElementById('admin-page-content');

    pageTitle.textContent = 'Báo cáo Doanh thu';
    contentArea.innerHTML = '<div class="d-flex justify-content-center mt-5"><div class="spinner-border" role="status"></div></div>';

    try {
        const response = await fetch('api/revenue/summary.php');
        const result = await response.json();

        if (!result.success) {
            contentArea.innerHTML = `<div class="alert alert-danger">${result.message || 'Không thể tải dữ liệu doanh thu.'}</div>`;
            return;
        }

        const totalRevenue = Number(result.totalRevenue || 0).toLocaleString('vi-VN');
        const totalOrders = Number(result.totalOrders || 0);

        // Bảng doanh thu 7 ngày gần nhất
        const daily = result.revenueByDay || [];
        let dailyRows = '';
        if (daily.length > 0) {
            daily.forEach(item => {
                dailyRows += `
                    <tr>
                        <td>${item.date}</td>
                        <td class="text-end">${Number(item.revenue).toLocaleString('vi-VN')}đ</td>
                        <td class="text-center">${item.orders}</td>
                    </tr>
                `;
            });
        } else {
            dailyRows = '<tr><td colspan="3" class="text-center text-muted">Không có dữ liệu</td></tr>';
        }

        contentArea.innerHTML = `
            <div class="row g-3 mb-4">
                <div class="col-md-6">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">Tổng doanh thu</h5>
                            <p class="display-6 text-success m-0">${totalRevenue}đ</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">Tổng số đơn hàng</h5>
                            <p class="display-6 text-primary m-0">${totalOrders}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">Doanh thu 7 ngày gần nhất</h5>
                    <div class="table-responsive">
                        <table class="table table-bordered table-hover align-middle">
                            <thead class="table-light">
                                <tr>
                                    <th>Ngày</th>
                                    <th class="text-end">Doanh thu</th>
                                    <th class="text-center">Số đơn</th>
                                </tr>
                            </thead>
                            <tbody>${dailyRows}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Lỗi tải doanh thu:', error);
        contentArea.innerHTML = '<div class="alert alert-danger">Không thể tải dữ liệu doanh thu.</div>';
    }
}