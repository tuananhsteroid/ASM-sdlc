<?php
header("Content-Type: application/json; charset=UTF-8");

include_once __DIR__.'/../db_connect.php';

// --- HÀM KIỂM TRA MẬT KHẨU ---
function validatePassword($password) {
    $pattern = '/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?!.*\s).{8,}$/';
    return preg_match($pattern, $password);
}

// Lấy dữ liệu từ form (đã sửa tên biến)
$fullname = $_POST['FullName'] ?? '';
$email = $_POST['Email'] ?? '';
$phone = $_POST['PhoneNumber'] ?? '';
$role = $_POST['Role'] ?? '';
$password = $_POST['Password'] ?? '';

// ÁP DỤNG ĐIỀU KIỆN MẬT KHẨU
if (!validatePassword($password)) {
    echo json_encode([
        "success" => false, 
        "message" => "Mật khẩu không hợp lệ! Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa, 1 số, 1 ký tự đặc biệt và không chứa khoảng trắng."
    ]);
    exit();
}

// Mã hóa mật khẩu và thêm vào CSDL
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

$stmt = $conn->prepare("INSERT INTO employees (FullName, Email, PhoneNumber, Role, Password) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssss", $fullname, $email, $phone, $role, $hashedPassword);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Thêm nhân viên thành công."]);
} else {
    echo json_encode(["success" => false, "message" => "Lỗi: " . $stmt->error]);
}
$stmt->close();
$conn->close();
?>