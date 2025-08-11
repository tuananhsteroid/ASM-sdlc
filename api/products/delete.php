<?php
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__.'/../db_connect.php';

$data = json_decode(file_get_contents("php://input"));
$id = intval($data->id ?? 0);

if ($id > 0) {
    $stmt = $conn->prepare("DELETE FROM products WHERE ProductID = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Xóa sản phẩm thành công."]);
    } else {
        echo json_encode(["success" => false, "message" => "Xóa thất bại."]);
    }
    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "ID không hợp lệ."]);
}
$conn->close();
?>