<?php
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__.'/../db_connect.php';

try {
    $sql = "SELECT ProductID, ProductName, Description, ImageURL, Price, Category FROM products ORDER BY ProductID DESC";
    $result = $conn->query($sql);

    $products = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }
    }

    echo json_encode($products);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database query failed: " . $e->getMessage()]);
} finally {
    $conn->close();
}
?>