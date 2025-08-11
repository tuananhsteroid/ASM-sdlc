document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessageElement = document.getElementById('error-message');

    const displayMessage = (message, isError = true) => {
        if (errorMessageElement) {
            errorMessageElement.textContent = message;
            errorMessageElement.style.color = isError ? 'red' : 'green';
        } else {
            alert(message);
        }
    };

    // --- XỬ LÝ ĐĂNG NHẬP (login.php) ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            displayMessage('', false);

            if (!email || !password) {
                displayMessage('Vui lòng điền đầy đủ email và mật khẩu.', true);
                return;
            }

            try {
                const response = await fetch('api/auth/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include' 
                });

                const result = await response.json();
                if (response.ok && result.success) {
                    const role = result.user.role;
                    if (role === 'admin') {
                        window.location.href = 'admin.html';
                    } else if (role === 'Shipper') {
                        window.location.href = 'shipper.html';
                    } else {
                        window.location.href = 'home.html';
                    }
                } else {
                    displayMessage(result.message || 'Đăng nhập không thành công.', true);
                }
            } catch (err) {
                console.error('Lỗi khi gửi yêu cầu đăng nhập:', err);
                displayMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại.', true);
            }
        });
    }
});