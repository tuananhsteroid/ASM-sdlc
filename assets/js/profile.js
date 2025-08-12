document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();

    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('api/auth/logout.php');
                window.location.href = 'login.html';
            } catch {
                alert('Lỗi khi đăng xuất.');
            }
        });
    }

    const editBtn = document.querySelector('.btn-edit-profile');
    if (editBtn) {
        editBtn.addEventListener('click', toggleEditMode);
    }
});

let isEditing = false;
let originalUser = {};

async function loadUserProfile() {
    try {
        const res = await fetch('api/user/read.php');
        const data = await res.json();

        if (data.success && data.user) {
            originalUser = {...data.user};
            displayUserProfile(data.user);
            if (data.user.Role !== 'customer') {
                document.querySelector('.btn-edit-profile').style.display = 'none';
            }
        } else {
            // Nếu không lấy được user từ read.php, kiểm tra session để điều hướng theo vai trò
            const sessionRes = await fetch('api/auth/session.php');
            const sessionData = await sessionRes.json();
            if (sessionData.loggedIn && sessionData.user) {
                const role = sessionData.user.role;
                if (role === 'Shipper') {
                    window.location.href = 'shipper.html';
                    return;
                }
                if (role === 'admin') {
                    window.location.href = 'admin.html';
                    return;
                }
            }
            window.location.href = 'login.html';
        }
    } catch {
        // Thử kiểm tra session trước khi chuyển hướng login
        try {
            const sessionRes = await fetch('api/auth/session.php');
            const sessionData = await sessionRes.json();
            if (sessionData.loggedIn && sessionData.user) {
                const role = sessionData.user.role;
                if (role === 'Shipper') {
                    window.location.href = 'shipper.html';
                    return;
                }
                if (role === 'admin') {
                    window.location.href = 'admin.html';
                    return;
                }
            }
        } catch {}
        window.location.href = 'login.html';
    }
}

function displayUserProfile(user) {
    document.getElementById('customer-name').textContent = user.FullName;
    document.getElementById('customer-email').textContent = user.Email;
    document.getElementById('customer-phone').textContent = user.PhoneNumber || 'Chưa cập nhật';
    document.getElementById('customer-dob').textContent = user.DateOfBirth || 'Chưa cập nhật';

    const addressList = document.getElementById('address-list');
    if (addressList) {
        const displayAddress = user.Address && user.Address.trim() !== '' ? user.Address : 'Chưa cập nhật';
        addressList.innerHTML = `<div class="address-item" id="customer-address">${displayAddress}</div>`;
    }
}

function toggleEditMode() {
    const btn = document.querySelector('.btn-edit-profile');
    const nameEl = document.getElementById('customer-name');
    const phoneEl = document.getElementById('customer-phone');
    const dobEl = document.getElementById('customer-dob');
    const addressItem = document.getElementById('customer-address');

    if (!isEditing) {
        isEditing = true;
        btn.textContent = 'Lưu hồ sơ';
        btn.removeEventListener('click', toggleEditMode);
        btn.addEventListener('click', saveUserProfile);

        nameEl.innerHTML = `<input id="input-name" type="text" value="${originalUser.FullName}">`;
        phoneEl.innerHTML = `Số điện thoại: <input id="input-phone" type="text" value="${originalUser.PhoneNumber || ''}">`;
        dobEl.innerHTML = `Ngày sinh: <input id="input-dob" type="date" value="${originalUser.DateOfBirth || ''}">`;
        if (addressItem) {
            addressItem.innerHTML = `<input id="input-address" type="text" class="form-control" placeholder="Địa chỉ" value="${(originalUser.Address || '').replace(/"/g, '&quot;')}">`;
        }
    } else {
        isEditing = false;
        btn.textContent = 'Chỉnh sửa hồ sơ';
        btn.removeEventListener('click', saveUserProfile);
        btn.addEventListener('click', toggleEditMode);

        loadUserProfile();
    }
}

async function saveUserProfile() {
    const payload = {};
    const nameInput = document.getElementById('input-name');
    const phoneInput = document.getElementById('input-phone');
    const dobInput = document.getElementById('input-dob');
    const addressInput = document.getElementById('input-address');

    if (nameInput) payload.FullName = nameInput.value.trim();
    if (phoneInput) payload.PhoneNumber = phoneInput.value.trim();
    if (dobInput) payload.DateOfBirth = dobInput.value.trim();
    if (addressInput) payload.Address = addressInput.value.trim();

    try {
        const res = await fetch('api/user/update.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (result.success) {
            alert('Cập nhật hồ sơ thành công!');
            toggleEditMode();
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch {
        alert('Lỗi khi lưu hồ sơ, vui lòng thử lại.');
    }
}