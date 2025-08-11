<?php
// File: api/user/read.php
header('Content-Type: application/json');
session_start();


include_once $_SERVER['DOCUMENT_ROOT'].'/sdlc/api/db_connect.php';


$response = [
    'success' => false,
    'message' => '',
    'user' => null
];

// Kiểm tra đăng nhập
if (!isset($_SESSION['user_id'])) {
    $response['message'] = 'Vui lòng đăng nhập.';
    echo json_encode($response);
    exit();
}

$user_id = (int)$_SESSION['user_id'];

// Thêm kiểm tra kết nối để trả về lỗi rõ ràng hơn
if (!$conn) {
    $response['message'] = 'Lỗi kết nối cơ sở dữ liệu.';
    echo json_encode($response);
    exit();
}

try {
    $stmt = $conn->prepare("SELECT CustomerID, FullName, PhoneNumber, Email, DateOfBirth, Role FROM customeraccounts WHERE CustomerID = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($user = $result->fetch_assoc()) {
        $response['success'] = true;
        $response['message'] = 'Lấy thông tin người dùng thành công.';
        $response['user'] = $user;
    } else {
        $response['message'] = 'Không tìm thấy người dùng.';
    }

    $stmt->close();
} catch (Exception $ex) {
    $response['message'] = 'Lỗi cơ sở dữ liệu: ' . $ex->getMessage();
}

echo json_encode($response);
$conn->close();
?>