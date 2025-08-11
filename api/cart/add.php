<?php
header('Content-Type: application/json');
session_start();
include_once $_SERVER['DOCUMENT_ROOT'].'/sdlc/api/db_connect.php';

$response = ['success' => false, 'message' => ''];

// Kiểm tra đăng nhập
if (!isset($_SESSION['user_id'])) {
    $response['message'] = 'Vui lòng đăng nhập.';
    echo json_encode($response);
    exit();
}

$user_id = (int) $_SESSION['user_id'];

// Lấy dữ liệu JSON
$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['productId']) || !is_numeric($data['productId'])) {
    $response['message'] = 'Thiếu ID sản phẩm.';
    echo json_encode($response);
    exit();
}

$product_id = (int) $data['productId'];

try {
    // Kiểm tra sản phẩm tồn tại
    $stmt = $conn->prepare("SELECT ProductID FROM products WHERE ProductID = ?");
    if (!$stmt) throw new Exception($conn->error);
    $stmt->bind_param("i", $product_id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        $stmt->close();
        $response['message'] = 'Sản phẩm không tồn tại.';
        echo json_encode($response);
        exit();
    }
    $stmt->close();

    // Kiểm tra sản phẩm đã có trong giỏ chưa
    $stmt = $conn->prepare("SELECT CartItemID, Quantity FROM cart_items WHERE CustomerID = ? AND ProductID = ?");
    if (!$stmt) throw new Exception($conn->error);
    $stmt->bind_param("ii", $user_id, $product_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        // Cập nhật số lượng +1
        $newQty = $row['Quantity'] + 1;
        $update = $conn->prepare("UPDATE cart_items SET Quantity = ? WHERE CartItemID = ?");
        if (!$update) throw new Exception($conn->error);
        $update->bind_param("ii", $newQty, $row['CartItemID']);
        $update->execute();
        $update->close();
        $response['message'] = 'Đã cập nhật số lượng sản phẩm trong giỏ hàng.';
    } else {
        // Thêm mới
        $insert = $conn->prepare("INSERT INTO cart_items (CustomerID, ProductID, Quantity) VALUES (?, ?, 1)");
        if (!$insert) throw new Exception($conn->error);
        $insert->bind_param("ii", $user_id, $product_id);
        $insert->execute();
        $insert->close();
        $response['message'] = 'Đã thêm sản phẩm vào giỏ hàng.';
    }

    $stmt->close();
    $response['success'] = true;

} catch (Exception $e) {
    $response['message'] = 'Lỗi: ' . $e->getMessage();
}

echo json_encode($response);
$conn->close();
?>
