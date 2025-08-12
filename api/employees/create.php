<?php
header("Content-Type: application/json; charset=UTF-8");

include_once __DIR__.'/../db_connect.php';

// --- HÀM KIỂM TRA MẬT KHẨU ---
function validatePassword($password) {
    $pattern = '/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?!.*\s).{8,}$/';
    return preg_match($pattern, $password);
}

// Lấy dữ liệu từ form
$fullname = trim($_POST['FullName'] ?? '');
$email = trim($_POST['Email'] ?? '');
$phone = trim($_POST['PhoneNumber'] ?? '');
$role = trim($_POST['Role'] ?? '');
$password = $_POST['Password'] ?? '';

// Validate bắt buộc
if ($fullname === '' || $email === '' || $role === '' || $password === '') {
    echo json_encode(["success" => false, "message" => "Vui lòng nhập đầy đủ Họ tên, Email, Vai trò và Mật khẩu."]);
    $conn->close();
    exit();
}

// Giới hạn vai trò cho phép
$allowedRoles = ['Restaurant', 'Shipper'];
if (!in_array($role, $allowedRoles, true)) {
    echo json_encode(["success" => false, "message" => "Vai trò không hợp lệ. Chỉ chấp nhận: Restaurant, Shipper."]);
    $conn->close();
    exit();
}

// Điều kiện mật khẩu
if (!validatePassword($password)) {
    echo json_encode([
        "success" => false,
        "message" => "Mật khẩu không hợp lệ! Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa, 1 số, 1 ký tự đặc biệt và không chứa khoảng trắng."
    ]);
    $conn->close();
    exit();
}

// Kiểm tra trùng email trong bảng employees
$checkStmt = $conn->prepare("SELECT 1 FROM employees WHERE Email = ? LIMIT 1");
if ($checkStmt) {
    $checkStmt->bind_param("s", $email);
    $checkStmt->execute();
    $checkStmt->store_result();
    if ($checkStmt->num_rows > 0) {
        $checkStmt->close();
        echo json_encode(["success" => false, "message" => "Email này đã tồn tại trong hệ thống nhân viên."]);
        $conn->close();
        exit();
    }
    $checkStmt->close();
}

// Mã hóa mật khẩu và thêm vào CSDL
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

$stmt = $conn->prepare("INSERT INTO employees (FullName, Email, PhoneNumber, Role, Password) VALUES (?, ?, ?, ?, ?)");
if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Không thể chuẩn bị truy vấn: " . $conn->error]);
    $conn->close();
    exit();
}
$stmt->bind_param("sssss", $fullname, $email, $phone, $role, $hashedPassword);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Thêm nhân viên thành công."]);
} else {
    echo json_encode(["success" => false, "message" => "Lỗi: " . $stmt->error]);
}
$stmt->close();
$conn->close();
?>