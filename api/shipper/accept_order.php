<?php
// File: api/shipper/accept_order.php

header('Content-Type: application/json; charset=UTF-8');
session_start();
include_once __DIR__.'/../db_connect.php';

$response = ['success' => false, 'message' => ''];

// Kiểm tra quyền truy cập của Shipper
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'Shipper') {
    $response['message'] = 'Không có quyền truy cập.';
    echo json_encode($response);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->orderId)) {
    $response['message'] = 'Thiếu ID đơn hàng.';
    echo json_encode($response);
    exit();
}

$orderId = (int) $data->orderId;
$shipperId = (int) $_SESSION['user_id'];

if ($conn->connect_error) {
    $response['message'] = 'Lỗi kết nối CSDL: ' . $conn->connect_error;
    echo json_encode($response);
    exit();
}

try {
    // Bắt đầu một giao dịch để đảm bảo tính toàn vẹn dữ liệu
    $conn->begin_transaction();
    
    // Kiểm tra lại trạng thái đơn hàng trước khi cập nhật
    $checkSql = "SELECT Status FROM orders WHERE OrderID = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param('i', $orderId);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result()->fetch_assoc();
    
    if (!$checkResult || $checkResult['Status'] !== 'pending_delivery') {
        $conn->rollback();
        $response['message'] = 'Đơn hàng này không còn ở trạng thái chờ hoặc không tồn tại.';
        echo json_encode($response);
        exit();
    }

    // Cập nhật trạng thái đơn hàng và gán shipper
    $updateSql = "UPDATE orders SET Status = 'delivering', ShipperID = ? WHERE OrderID = ?";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->bind_param('ii', $shipperId, $orderId);

    if ($updateStmt->execute()) {
        $conn->commit();
        $response['success'] = true;
        $response['message'] = 'Đã chấp nhận đơn hàng thành công!';
    } else {
        $conn->rollback();
        throw new Exception('Lỗi cập nhật CSDL: ' . $updateStmt->error);
    }
} catch (Exception $e) {
    $conn->rollback();
    $response['message'] = 'Đã xảy ra lỗi: ' . $e->getMessage();
}

echo json_encode($response);
$conn->close();