<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../db_connect.php'; 

$id = intval($_GET['id'] ?? 0);

if ($id > 0) {
    $stmt = $conn->prepare("SELECT * FROM products WHERE ProductID = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $product = $result->fetch_assoc();
    $stmt->close();
    
    echo json_encode($product);
} else {
     echo json_encode(null);
}
$conn->close();
?>