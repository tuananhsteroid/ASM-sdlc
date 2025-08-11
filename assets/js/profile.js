document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadUserAddresses();

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
    
    document.getElementById('add-address-btn').addEventListener('click', () => {
        alert('Chức năng thêm địa chỉ đang được phát triển.');
    });
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
      const sessionRes = await fetch('api/auth/session.php');
      const sessionData = await sessionRes.json();
      if (sessionData.loggedIn && sessionData.user) {
        const role = sessionData.user.role;
        if (role === 'Shipper') { window.location.href = 'shipper.html'; return; }
        if (role === 'admin') { window.location.href = 'admin.html'; return; }
      }
      window.location.href = 'login.html';
    }
  } catch {
    try {
      const sessionRes = await fetch('api/auth/session.php');
      const sessionData = await sessionRes.json();
      if (sessionData.loggedIn && sessionData.user) {
        const role = sessionData.user.role;
        if (role === 'Shipper') { window.location.href = 'shipper.html'; return; }
        if (role === 'admin') { window.location.href = 'admin.html'; return; }
      }
    } catch {}
    window.location.href = 'login.html';
  }
}

async function loadUserAddresses() {
    // Đây là phần giả lập dữ liệu địa chỉ, bạn cần thay thế bằng API thật
    // Ví dụ: const res = await fetch('api/user/addresses/read.php');
    //        const data = await res.json();
    
    const mockAddresses = [
        {
            id: 1,
            name: 'Nhà riêng',
            street: '123 Đường Nguyễn Huệ',
            city: 'Quận 1',
            province: 'TP. Hồ Chí Minh',
            postalCode: '700000',
            isDefault: true
        },
        {
            id: 2,
            name: 'Văn phòng',
            street: '456 Đường Lê Lợi',
            city: 'Quận 1',
            province: 'TP. Hồ Chí Minh',
            postalCode: '700000',
            isDefault: false
        }
    ];

    if (mockAddresses && mockAddresses.length > 0) {
        renderAddresses(mockAddresses);
    } else {
        const addressList = document.getElementById('address-list');
        addressList.innerHTML = '<p class="text-center text-muted">Chưa có địa chỉ nào được lưu.</p>';
    }
}

function renderAddresses(addresses) {
    const addressList = document.getElementById('address-list');
    addressList.innerHTML = addresses.map(addr => `
        <div class="address-card">
            <div class="address-actions">
                <button onclick="editAddress(${addr.id})"><i class="fas fa-edit"></i></button>
                <button onclick="deleteAddress(${addr.id})"><i class="fas fa-trash-alt"></i></button>
            </div>
            <p class="address-title">${addr.name} ${addr.isDefault ? '<span class="badge bg-primary">Mặc định</span>' : ''}</p>
            <p class="address-details">${addr.street}, ${addr.city}, ${addr.province}, ${addr.postalCode}</p>
        </div>
    `).join('');
}

function editAddress(addressId) {
    alert(`Chỉnh sửa địa chỉ có ID: ${addressId}`);
}

function deleteAddress(addressId) {
    if (confirm(`Bạn có chắc chắn muốn xóa địa chỉ có ID: ${addressId}?`)) {
        alert('Chức năng xóa địa chỉ đang được phát triển.');
        // Gọi API xóa địa chỉ tại đây
        // Ví dụ: await fetch(`api/user/addresses/delete.php?id=${addressId}`);
    }
}

function displayUserProfile(user) {
    document.getElementById('customer-name').textContent = user.FullName;
    document.getElementById('customer-email').textContent = user.Email;
    document.getElementById('customer-phone').textContent = user.PhoneNumber || 'Chưa cập nhật';
    document.getElementById('customer-dob').textContent = user.DateOfBirth || 'Chưa cập nhật';
}

function toggleEditMode() {
    const btn = document.querySelector('.btn-edit-profile');
    const nameEl = document.getElementById('customer-name');
    const phoneEl = document.getElementById('customer-phone');
    const dobEl = document.getElementById('customer-dob');

    if (!isEditing) {
        isEditing = true;
        btn.textContent = 'Lưu hồ sơ';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');
        btn.removeEventListener('click', toggleEditMode);
        btn.addEventListener('click', saveUserProfile);

        nameEl.innerHTML = `<input id="input-name" type="text" class="form-control" value="${originalUser.FullName}">`;
        phoneEl.innerHTML = `<input id="input-phone" type="text" class="form-control" value="${originalUser.PhoneNumber || ''}">`;
        dobEl.innerHTML = `<input id="input-dob" type="date" class="form-control" value="${originalUser.DateOfBirth || ''}">`;
    } else {
        isEditing = false;
        btn.textContent = 'Chỉnh sửa hồ sơ';
        btn.classList.remove('btn-success');
        btn.classList.add('btn-primary');
        btn.removeEventListener('click', saveUserProfile);
        btn.addEventListener('click', toggleEditMode);

        loadUserProfile();
    }
}

async function saveUserProfile() {
    const updatedData = {
        FullName: document.getElementById('input-name').value.trim(),
        PhoneNumber: document.getElementById('input-phone').value.trim(),
        DateOfBirth: document.getElementById('input-dob').value.trim()
    };

    try {
        const res = await fetch('api/user/update.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(updatedData)
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