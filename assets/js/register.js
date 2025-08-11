document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registrationForm');
    
    // Thêm các element thông báo lỗi mới
    const passwordErrorElement = document.getElementById('password-error');
    const confirmPasswordErrorElement = document.getElementById('confirm-password-error');
    
    // Hàm hiển thị thông báo lỗi
    const displayError = (element, message) => {
        element.textContent = message;
        element.style.display = message ? 'block' : 'none';
    };

    // --- XỬ LÝ ĐĂNG KÝ (register.php) ---
    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Xóa tất cả các thông báo lỗi cũ
            displayError(passwordErrorElement, '');
            displayError(confirmPasswordErrorElement, '');
            
            const fullName = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const address = document.getElementById('address').value.trim();
            const dateOfBirth = document.getElementById('dateOfBirth').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Kiểm tra đầu vào phía client
            if (!fullName || !email || !phone || !address || !dateOfBirth || !password || !confirmPassword) {
                alert('Vui lòng điền đầy đủ tất cả các trường.');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Vui lòng nhập địa chỉ email hợp lệ.');
                return;
            }

            const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
            if (!passwordRegex.test(password)) {
                displayError(passwordErrorElement, 'Mật khẩu cần có ít nhất 8 ký tự, một chữ hoa, một số và một ký tự đặc biệt.');
                return;
            }

            if (password !== confirmPassword) {
                displayError(confirmPasswordErrorElement, 'Mật khẩu và xác nhận mật khẩu không khớp.');
                return;
            }

            try {
                const response = await fetch('api/auth/register.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName, email, phone, address, dateOfBirth, password })
                });

                const result = await response.json();
                if (response.status === 201) {
                    alert(result.message); // Sử dụng alert cho thông báo thành công
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1000);
                } else {
                    alert(result.message || 'Đăng ký thất bại. Vui lòng thử lại.');
                }
            } catch (err) {
                console.error('Lỗi khi gửi yêu cầu đăng ký:', err);
                alert('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
            }
        });
    }
});