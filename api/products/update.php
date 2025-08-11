<?php
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__.'/../db_connect.php';

$id = intval($_POST['id'] ?? 0);
$name = $_POST['product_name'] ?? '';
$price = floatval($_POST['price'] ?? 0);
$desc = $_POST['description'] ?? '';
$category = $_POST['category'] ?? '';

// Lấy ảnh cũ trước
$stmt_old = $conn->prepare("SELECT ImageURL FROM products WHERE ProductID = ?");
$stmt_old->bind_param("i", $id);
$stmt_old->execute();
$result_old = $stmt_old->get_result();
$row_old = $result_old->fetch_assoc();
$imageURL = $row_old['ImageURL'];
$stmt_old->close();

if (isset($_FILES['image']) && $_FILES['image']['error'] === 0) {
    // Upload ảnh mới nếu có
    $targetDir = "../../uploads/";
    $filename = basename($_FILES['image']['name']);
    $targetFilePath = $targetDir . time() . '_' . $filename;
    if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFilePath)) {
        $imageURL = "uploads/" . basename($targetFilePath);
    }
}

$stmt = $conn->prepare("UPDATE products SET ProductName=?, Price=?, Description=?, ImageURL=?, Category=? WHERE ProductID=?");
$stmt->bind_param("sdsssi", $name, $price, $desc, $imageURL, $category, $id);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Cập nhật sản phẩm thành công."]);
} else {
    echo json_encode(["success" => false, "message" => "Lỗi: " . $stmt->error]);
}
$stmt->close();
$conn->close();
?>