<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../db_connect.php'; // Giả định bạn có file kết nối DB

$name = $_POST['product_name'] ?? '';
$price = floatval($_POST['price'] ?? 0);
$desc = $_POST['description'] ?? '';
$category = $_POST['category'] ?? '';
$imageURL = '';

if (isset($_FILES['image']) && $_FILES['image']['error'] === 0) {
    $targetDir = "../../uploads/";
    if (!is_dir($targetDir)) mkdir($targetDir, 0755, true);
    $filename = basename($_FILES['image']['name']);
    $targetFilePath = $targetDir . time() . '_' . $filename;
    if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFilePath)) {
        $imageURL = "uploads/" . basename($targetFilePath);
    }
}

$stmt = $conn->prepare("INSERT INTO products (ProductName, Price, Description, ImageURL, Category) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sdsss", $name, $price, $desc, $imageURL, $category);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Thêm sản phẩm thành công."]);
} else {
    echo json_encode(["success" => false, "message" => "Lỗi: " . $stmt->error]);
}
$stmt->close();
$conn->close();
?>