<?php
header('Content-Type: application/json');
session_start();
include_once $_SERVER['DOCUMENT_ROOT'].'/sdlc/api/db_connect.php';

$response = ['success' => false, 'message' => ''];

if (!isset($_SESSION['user_id'])) {
    $response['message'] = 'Vui lòng đăng nhập.';
    echo json_encode($response);
    exit();
}

$user_id = (int) $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['cartItemId']) || !is_numeric($data['cartItemId'])) {
    $response['message'] = 'Dữ liệu không hợp lệ.';
    echo json_encode($response);
    exit();
}

$cartItemId = (int) $data['cartItemId'];

try {
    // Kiểm tra xem cart item có thuộc user không
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

    // Xóa cart item
    $delete = $conn->prepare("DELETE FROM cart_items WHERE CartItemID = ?");
    if (!$delete) throw new Exception('Lỗi chuẩn bị truy vấn xóa: ' . $conn->error);
    $delete->bind_param("i", $cartItemId);
    if (!$delete->execute()) throw new Exception('Lỗi thực thi truy vấn xóa: ' . $delete->error);
    $delete->close();

    $response['success'] = true;
    $response['message'] = 'Đã xóa sản phẩm khỏi giỏ hàng.';
} catch (Exception $e) {
    $response['message'] = 'Lỗi: ' . $e->getMessage();
}

echo json_encode($response);
$conn->close();
?>
