<?php
// File: api/shipper/read_new_orders.php

header('Content-Type: application/json; charset=UTF-8');
session_start();
include_once __DIR__.'/../db_connect.php';

$response = ['success' => false, 'message' => '', 'orders' => []];

// Kiểm tra quyền truy cập của Shipper
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'Shipper') {
    $response['message'] = 'Không có quyền truy cập.';
    echo json_encode($response);
    exit();
}

if ($conn->connect_error) {
    $response['message'] = 'Lỗi kết nối CSDL: ' . $conn->connect_error;
    echo json_encode($response);
    exit();
}

try {
    // Truy vấn các đơn hàng có trạng thái chờ (pending_delivery)
    $sql = "
        SELECT 
            o.OrderID,
            o.TotalPrice,
            o.PickupAddress,
            o.DeliveryAddress,
            c.FullName as CustomerName,
            o.OrderDate
        FROM orders o
        JOIN customers c ON c.CustomerID = o.CustomerID
        WHERE o.Status = 'pending_delivery'
        ORDER BY o.OrderDate DESC
    ";
    
    $result = $conn->query($sql);

    if ($result) {
        $orders = [];
        while ($row = $result->fetch_assoc()) {
            // Giả định một khoảng cách ngẫu nhiên để mô phỏng
            $row['Distance'] = round(rand(10, 50) / 10, 1); 
            $orders[] = $row;
        }
        $response['success'] = true;
        $response['orders'] = $orders;
    } else {
        throw new Exception('Lỗi truy vấn CSDL: ' . $conn->error);
    }
} catch (Exception $e) {
    $response['message'] = 'Đã xảy ra lỗi: ' . $e->getMessage();
}

echo json_encode($response);
$conn->close();