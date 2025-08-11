<?php
header('Content-Type: application/json');
session_start();
include_once $_SERVER['DOCUMENT_ROOT'].'/sdlc/api/db_connect.php';

$response = ['success' => false, 'message' => '', 'cartItems' => []];

// Kiểm tra đăng nhập
if (!isset($_SESSION['user_id'])) {
    $response['message'] = 'Vui lòng đăng nhập.';
    echo json_encode($response);
    exit();
}

$user_id = (int) $_SESSION['user_id'];

try {
    $stmt = $conn->prepare("
        SELECT ci.CartItemID, ci.ProductID, ci.Quantity, p.ProductName, p.Price, p.ImageURL
        FROM cart_items ci
        JOIN products p ON ci.ProductID = p.ProductID
        WHERE ci.CustomerID = ?
    ");

    if (!$stmt) {
        throw new Exception('Chuẩn bị truy vấn thất bại: ' . $conn->error);
    }

    $stmt->bind_param("i", $user_id);

    if (!$stmt->execute()) {
        throw new Exception('Thực thi truy vấn thất bại: ' . $stmt->error);
    }

    $result = $stmt->get_result();

    $cartItems = [];
    while ($row = $result->fetch_assoc()) {
        $cartItems[] = $row;
    }

    $response['success'] = true;
    $response['message'] = 'Lấy giỏ hàng thành công.';
    $response['cartItems'] = $cartItems;

    $stmt->close();

} catch (Exception $e) {
    $response['message'] = 'Lỗi: ' . $e->getMessage();
}

echo json_encode($response);
$conn->close();
?>
