<?php
header('Content-Type: application/json; charset=UTF-8');
include_once __DIR__.'/../db_connect.php';

$response = ['success' => false, 'message' => ''];

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $orderId = isset($data['orderId']) ? (int)$data['orderId'] : 0;
    $status = isset($data['status']) ? trim($data['status']) : '';

    if ($orderId <= 0) {
        throw new Exception('OrderID không hợp lệ.');
    }

    // Danh sách trạng thái cho phép (VN)
    $allowed = ['Chờ xác nhận', 'Đã xác nhận', 'Hoàn thành', 'Đã hủy'];
    if (!in_array($status, $allowed, true)) {
        throw new Exception('Trạng thái không hợp lệ.');
    }

    $stmt = $conn->prepare("UPDATE orders SET Status = ? WHERE OrderID = ?");
    if (!$stmt) {
        throw new Exception('Không thể chuẩn bị truy vấn.');
    }
    $stmt->bind_param('si', $status, $orderId);
    if (!$stmt->execute()) {
        throw new Exception('Cập nhật trạng thái thất bại.');
    }
    $stmt->close();

    $response['success'] = true;
    $response['message'] = 'Cập nhật trạng thái đơn hàng thành công.';
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

$conn->close();
echo json_encode($response);