<?php
header('Content-Type: application/json; charset=UTF-8');
session_start();

include_once __DIR__.'/../db_connect.php';

$response = [
    'success' => false,
    'message' => '',
    'totalRevenue' => 0,
    'totalOrders' => 0,
    'revenueByDay' => []
];

if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin','employee'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Không có quyền truy cập.'
    ]);
    $conn->close();
    exit();
}

try {
    // Tổng doanh thu và số đơn (không tính giỏ/cart)
    $totalSql = "
        SELECT 
            COALESCE(SUM(od.Quantity * od.PriceAtPurchase), 0) AS totalRevenue,
            COUNT(DISTINCT o.OrderID) AS totalOrders
        FROM orders o
        JOIN order_details od ON od.OrderID = o.OrderID
        WHERE (o.Status IS NULL OR o.Status <> 'cart')
    ";
    $totalRes = $conn->query($totalSql);
    if ($totalRes === false) {
        throw new Exception('Lỗi truy vấn tổng: ' . $conn->error);
    }
    $totalRow = $totalRes->fetch_assoc();

    // Doanh thu 7 ngày gần nhất
    $dailySql = "
        SELECT 
            DATE(o.OrderDate) AS date,
            COALESCE(SUM(od.Quantity * od.PriceAtPurchase), 0) AS revenue,
            COUNT(DISTINCT o.OrderID) AS orders
        FROM orders o
        JOIN order_details od ON od.OrderID = o.OrderID
        WHERE (o.Status IS NULL OR o.Status <> 'cart')
          AND o.OrderDate >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(o.OrderDate)
        ORDER BY DATE(o.OrderDate) ASC
    ";
    $dailyRes = $conn->query($dailySql);
    if ($dailyRes === false) {
        throw new Exception('Lỗi truy vấn ngày: ' . $conn->error);
    }

    $revenueByDay = [];
    // Fill missing days with 0
    $daysMap = [];
    for ($i = 6; $i >= 0; $i--) {
        $d = date('Y-m-d', strtotime("-$i day"));
        $daysMap[$d] = [
            'date' => $d,
            'revenue' => 0,
            'orders' => 0
        ];
    }
    while ($row = $dailyRes->fetch_assoc()) {
        $d = $row['date'];
        $daysMap[$d] = [
            'date' => $d,
            'revenue' => (float)$row['revenue'],
            'orders' => (int)$row['orders']
        ];
    }
    $revenueByDay = array_values($daysMap);

    $response['success'] = true;
    $response['totalRevenue'] = (float)$totalRow['totalRevenue'];
    $response['totalOrders'] = (int)$totalRow['totalOrders'];
    $response['revenueByDay'] = $revenueByDay;
} catch (Exception $e) {
    $response['message'] = 'Đã xảy ra lỗi: ' . $e->getMessage();
}

echo json_encode($response);
$conn->close();