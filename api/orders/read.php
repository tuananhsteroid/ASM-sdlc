<?php
header('Content-Type: application/json; charset=UTF-8');
session_start();

include_once __DIR__.'/../db_connect.php';

$response = [
    'success' => false,
    'message' => '',
    'orders' => []
];

// Optional: authorize only admin/employee
if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin','employee'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Không có quyền truy cập.'
    ]);
    $conn->close();
    exit();
}

try {
    $sql = "
        SELECT 
            o.OrderID,
            o.OrderDate,
            o.Status,
            c.FullName AS CustomerName,
            SUM(od.Quantity * od.PriceAtPurchase) AS OrderTotal,
            SUM(od.Quantity) AS ItemCount
        FROM orders o
        LEFT JOIN customeraccounts c ON c.CustomerID = o.CustomerID
        LEFT JOIN order_details od ON od.OrderID = o.OrderID
        WHERE (o.Status IS NULL OR o.Status <> 'cart')
        GROUP BY o.OrderID, o.OrderDate, o.Status, c.FullName
        ORDER BY o.OrderDate DESC, o.OrderID DESC
    ";

    $result = $conn->query($sql);
    if ($result === false) {
        throw new Exception('Lỗi truy vấn: ' . $conn->error);
    }

    $orders = [];
    while ($row = $result->fetch_assoc()) {
        $orders[] = [
            'OrderID' => (int)$row['OrderID'],
            'OrderDate' => $row['OrderDate'],
            'Status' => $row['Status'],
            'CustomerName' => $row['CustomerName'],
            'OrderTotal' => (float)($row['OrderTotal'] ?? 0),
            'ItemCount' => (int)($row['ItemCount'] ?? 0)
        ];
    }

    $response['success'] = true;
    $response['orders'] = $orders;
} catch (Exception $e) {
    $response['message'] = 'Đã xảy ra lỗi: ' . $e->getMessage();
}

echo json_encode($response);
$conn->close();