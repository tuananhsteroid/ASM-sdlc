<?php
header('Content-Type: application/json; charset=UTF-8');
session_start();

include_once __DIR__.'/../db_connect.php';

$response = [
    'success' => false,
    'message' => '',
    'orders' => []
];

if (!isset($_SESSION['user_id'])) {
    $response['message'] = 'Vui lòng đăng nhập.';
    echo json_encode($response);
    exit();
}

$userId = (int) $_SESSION['user_id'];

if ($conn->connect_error) {
    $response['message'] = 'Lỗi kết nối CSDL: ' . $conn->connect_error;
    echo json_encode($response);
    exit();
}

try {
    $sql = "
        SELECT 
            o.OrderID,
            o.OrderDate,
            o.Status,
            od.ProductID,
            od.Quantity,
            od.PriceAtPurchase,
            p.ProductName,
            p.ImageURL
        FROM orders o
        LEFT JOIN order_details od ON od.OrderID = o.OrderID
        LEFT JOIN products p ON p.ProductID = od.ProductID
        WHERE o.CustomerID = ? AND (o.Status IS NULL OR o.Status <> 'cart')
        ORDER BY o.OrderDate DESC, o.OrderID DESC
    ";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Lỗi chuẩn bị truy vấn: ' . $conn->error);
    }

    $stmt->bind_param('i', $userId);
    if (!$stmt->execute()) {
        $stmt->close();
        throw new Exception('Lỗi thực thi truy vấn: ' . $stmt->error);
    }

    $result = $stmt->get_result();

    $ordersMap = [];

    while ($row = $result->fetch_assoc()) {
        $orderId = (int) $row['OrderID'];

        if (!isset($ordersMap[$orderId])) {
            $ordersMap[$orderId] = [
                'OrderID' => $orderId,
                'OrderDate' => $row['OrderDate'],
                'Status' => $row['Status'],
                'order_details' => []
            ];
        }

        if (!is_null($row['ProductID'])) {
            $ordersMap[$orderId]['order_details'][] = [
                'ProductID' => (int) $row['ProductID'],
                'ProductName' => $row['ProductName'],
                'ImageURL' => $row['ImageURL'],
                'Quantity' => (int) $row['Quantity'],
                'PriceAtPurchase' => (float) $row['PriceAtPurchase']
            ];
        }
    }

    $stmt->close();

    $response['success'] = true;
    $response['orders'] = array_values($ordersMap);
} catch (Exception $e) {
    $response['message'] = 'Đã xảy ra lỗi: ' . $e->getMessage();
}

echo json_encode($response);
$conn->close();