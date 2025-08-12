<?php
header('Content-Type: application/json; charset=UTF-8');
include_once __DIR__.'/../db_connect.php';

try {
    // Tổng doanh thu từ các đơn Hoàn thành
    $sqlTotal = "
        SELECT COALESCE(SUM(od.Quantity * od.PriceAtPurchase), 0) AS TotalRevenue
        FROM orders o
        JOIN order_details od ON od.OrderID = o.OrderID
        WHERE o.Status = 'Hoàn thành'
    ";
    $totalRes = $conn->query($sqlTotal);
    $totalRow = $totalRes ? $totalRes->fetch_assoc() : ['TotalRevenue' => 0];
    $totalRevenue = (float)$totalRow['TotalRevenue'];

    // Doanh thu theo ngày (chỉ đơn Hoàn thành)
    $sqlByDate = "
        SELECT DATE(o.OrderDate) AS OrderDay,
               COALESCE(SUM(od.Quantity * od.PriceAtPurchase), 0) AS Revenue
        FROM orders o
        JOIN order_details od ON od.OrderID = o.OrderID
        WHERE o.Status = 'Hoàn thành'
        GROUP BY DATE(o.OrderDate)
        ORDER BY OrderDay DESC
        LIMIT 30
    ";
    $byDateRes = $conn->query($sqlByDate);
    $daily = [];
    if ($byDateRes && $byDateRes->num_rows > 0) {
        while ($r = $byDateRes->fetch_assoc()) {
            $daily[] = [
                'date' => $r['OrderDay'],
                'revenue' => (float)$r['Revenue']
            ];
        }
    }

    echo json_encode([
        'success' => true,
        'totalRevenue' => $totalRevenue,
        'daily' => $daily
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} finally {
    $conn->close();
}