<?php
header('Content-Type: application/json');
session_start();
include_once __DIR__.'/../db_connect.php';

$response = ['success' => false, 'message' => ''];

if (!isset($_SESSION['user_id'])) {
    $response['message'] = 'Vui lòng đăng nhập.';
    echo json_encode($response);
    exit();
}

$user_id = (int) $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['cartItemId'], $data['quantity']) || !is_numeric($data['cartItemId']) || !is_numeric($data['quantity'])) {
    $response['message'] = 'Dữ liệu không hợp lệ.';
    echo json_encode($response);
    exit();
}

$cartItemId = (int) $data['cartItemId'];
$quantity = max(1, (int) $data['quantity']); // đảm bảo quantity >= 1

try {
    // Kiểm tra cart item thuộc user không
    $stmt = $conn->prepare("SELECT CartItemID FROM cart_items WHERE CartItemID = ? AND CustomerID = ?");
    if (!$stmt) throw new Exception('Lỗi chuẩn bị truy vấn: ' . $conn->error);
    $stmt->bind_param("ii", $cartItemId, $user_id);
    if (!$stmt->execute()) throw new Exception('Lỗi thực thi truy vấn: ' . $stmt->error);
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        $response['message'] = 'Không tìm thấy sản phẩm trong giỏ hàng.';
        echo json_encode($response);
        exit();
    }
    $stmt->close();

    // Cập nhật số lượng
    $update = $conn->prepare("UPDATE cart_items SET Quantity = ? WHERE CartItemID = ?");
    if (!$update) throw new Exception('Lỗi chuẩn bị truy vấn cập nhật: ' . $conn->error);
    $update->bind_param("ii", $quantity, $cartItemId);
    if (!$update->execute()) throw new Exception('Lỗi thực thi truy vấn cập nhật: ' . $update->error);
    $update->close();

    $response['success'] = true;
    $response['message'] = 'Cập nhật số lượng thành công.';
} catch (Exception $e) {
    $response['message'] = 'Lỗi: ' . $e->getMessage();
}

echo json_encode($response);
$conn->close();
?>
