<?php
// api/user/update.php
header('Content-Type: application/json');
session_start();

include_once __DIR__.'/../db_connect.php';

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
$data = json_decode(file_get_contents('php://input'), true) ?: [];

// Cho phép cập nhật từng phần, nhưng cần ít nhất một trường hợp lệ
$allowedFields = ['FullName', 'PhoneNumber', 'DateOfBirth', 'Address'];
$updates = [];
$params = [];
$types = '';

foreach ($allowedFields as $field) {
    if (array_key_exists($field, $data)) {
        $updates[] = "$field = ?";
        $params[] = trim((string)$data[$field]);
        $types .= 's';
    }
}

if (empty($updates)) {
    $response['message'] = 'Không có dữ liệu để cập nhật.';
    echo json_encode($response);
    exit();
}

if (!$conn) {
    $response['message'] = 'Lỗi kết nối cơ sở dữ liệu.';
    echo json_encode($response);
    exit();
}

try {
    $sql = "UPDATE customeraccounts SET " . implode(', ', $updates) . " WHERE CustomerID = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Lỗi chuẩn bị truy vấn: ' . $conn->error);
    }

    // Bind dynamic params
    $types .= 'i';
    $params[] = $user_id;
    $stmt->bind_param($types, ...$params);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        if (isset($data['FullName'])) {
            $_SESSION['fullname'] = $data['FullName'];
        }
        if (isset($data['PhoneNumber'])) {
            $_SESSION['phone'] = $data['PhoneNumber'];
        }
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
?>