<?php
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__.'/../db_connect.php';

// --- HÀM KIỂM TRA MẬT KHẨU ---
function validatePassword($password) {
    $pattern = '/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?!.*\s).{8,}$/';
    return preg_match($pattern, $password);
}

// Lấy dữ liệu từ form
$id = intval($_POST['id'] ?? 0);
$fullname = $_POST['FullName'] ?? '';
$email = $_POST['Email'] ?? '';
$phone = $_POST['PhoneNumber'] ?? '';
$role = $_POST['Role'] ?? '';
$newPassword = $_POST['Password'] ?? '';

if ($id <= 0) {
    echo json_encode(["success" => false, "message" => "ID nhân viên không hợp lệ."]);
    exit();
}

// Chỉ kiểm tra và cập nhật mật khẩu nếu người dùng nhập mật khẩu mới
if (!empty($newPassword)) {
    // ÁP DỤNG ĐIỀU KIỆN
    if (!validatePassword($newPassword)) {
        echo json_encode([
            "success" => false, 
            "message" => "Mật khẩu mới không hợp lệ! Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa, 1 số, 1 ký tự đặc biệt và không chứa khoảng trắng."
        ]);
        exit();
    }
    // Cập nhật tất cả các trường, bao gồm cả mật khẩu đã hash
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("UPDATE employees SET FullName=?, Email=?, PhoneNumber=?, Role=?, Password=? WHERE EmployeeID=?");
    $stmt->bind_param("sssssi", $fullname, $email, $phone, $role, $hashedPassword, $id);
} else {
    // Không có mật khẩu mới -> Chỉ cập nhật các trường thông tin khác
    $stmt = $conn->prepare("UPDATE employees SET FullName=?, Email=?, PhoneNumber=?, Role=? WHERE EmployeeID=?");
    $stmt->bind_param("ssssi", $fullname, $email, $phone, $role, $id);
}

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Cập nhật thông tin nhân viên thành công."]);
} else {
    echo json_encode(["success" => false, "message" => "Lỗi khi cập nhật: " . $stmt->error]);
}
$stmt->close();
$conn->close();
?>