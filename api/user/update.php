<?php
// api/user/update.php
header('Content-Type: application/json');
session_start();

include_once $_SERVER['DOCUMENT_ROOT'].'/sdlc/api/db_connect.php';


$response = [
    'success' => false,
    'message' => ''
];

if (!isset($_SESSION['user_id'])) {
    $response['message'] = 'Vui lòng đăng nhập.';
    echo json_encode($response);
    exit();
}

$user_id = (int) $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);

if (
    empty($data['FullName']) ||
    !isset($data['PhoneNumber']) ||
    !isset($data['DateOfBirth'])
) {
    $response['message'] = 'Thiếu dữ liệu bắt buộc.';
    echo json_encode($response);
    exit();
}

$fullname = trim($data['FullName']);
$phone = trim($data['PhoneNumber']);
$dob = trim($data['DateOfBirth']);

// Có thể thêm validate ngày tháng, phone nếu muốn

if (!$conn) {
    $response['message'] = 'Lỗi kết nối cơ sở dữ liệu.';
    echo json_encode($response);
    exit();
}

try {
    $stmt = $conn->prepare("UPDATE customeraccounts SET FullName = ?, PhoneNumber = ?, DateOfBirth = ? WHERE CustomerID = ?");
    $stmt->bind_param("sssi", $fullname, $phone, $dob, $user_id);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        // Cập nhật session nếu cần
        $_SESSION['fullname'] = $fullname;
        $_SESSION['phone'] = $phone;

        $response['success'] = true;
        $response['message'] = 'Cập nhật thông tin thành công.';
    } else {
        $response['message'] = 'Không có thay đổi nào được thực hiện.';
    }
    $stmt->close();
} catch (Exception $ex) {
    $response['message'] = 'Lỗi cơ sở dữ liệu: ' . $ex->getMessage();
}

echo json_encode($response);
$conn->close();
