<?php
header('Content-Type: application/json');
session_start();
include_once __DIR__.'/../db_connect.php';

$response = ['success' => false, 'message' => ''];

if (!isset($_SESSION['user_id'])) {
    $response['message'] = 'Vui lòng đăng nhập để thanh toán.';
    echo json_encode($response);
    exit();
}

$user_id = (int) $_SESSION['user_id'];

try {
    $conn->begin_transaction();

    // Lấy sản phẩm trong giỏ hàng
    $stmt = $conn->prepare("
        SELECT ci.ProductID, ci.Quantity, p.Price
        FROM cart_items ci
        JOIN products p ON ci.ProductID = p.ProductID
        WHERE ci.CustomerID = ?
    ");
    if (!$stmt) throw new Exception("Lỗi chuẩn bị truy vấn lấy giỏ hàng: " . $conn->error);

    $stmt->bind_param("i", $user_id);
    if (!$stmt->execute()) throw new Exception("Lỗi thực thi truy vấn lấy giỏ hàng: " . $stmt->error);

    $cartItems = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    if (empty($cartItems)) {
        $response['message'] = 'Giỏ hàng trống.';
        echo json_encode($response);
        exit();
    }

    // Tạo đơn hàng mới
    $insertOrder = $conn->prepare("INSERT INTO orders (CustomerID, OrderDate, Status) VALUES (?, NOW(), 'Chờ xác nhận')");
    if (!$insertOrder) throw new Exception("Lỗi chuẩn bị truy vấn tạo đơn hàng: " . $conn->error);
    $insertOrder->bind_param("i", $user_id);
    if (!$insertOrder->execute()) throw new Exception("Lỗi thực thi truy vấn tạo đơn hàng: " . $insertOrder->error);
    $orderId = $conn->insert_id;
    $insertOrder->close();

    // Chèn chi tiết đơn hàng
    $insertDetail = $conn->prepare("INSERT INTO order_details (OrderID, ProductID, Quantity, PriceAtPurchase) VALUES (?, ?, ?, ?)");
    if (!$insertDetail) throw new Exception("Lỗi chuẩn bị truy vấn chi tiết đơn hàng: " . $conn->error);

    foreach ($cartItems as $item) {
        $orderIdParam = $orderId;
        $productIdParam = $item['ProductID'];
        $quantityParam = $item['Quantity'];
        $priceParam = $item['Price'];

        $insertDetail->bind_param("iiid", $orderIdParam, $productIdParam, $quantityParam, $priceParam);
        if (!$insertDetail->execute()) {
            $insertDetail->close();
            throw new Exception("Lỗi chèn chi tiết đơn hàng: " . $insertDetail->error);
        }
    }
    $insertDetail->close();

    // Xóa giỏ hàng
    $deleteCart = $conn->prepare("DELETE FROM cart_items WHERE CustomerID = ?");
    if (!$deleteCart) throw new Exception("Lỗi chuẩn bị truy vấn xóa giỏ hàng: " . $conn->error);
    $deleteCart->bind_param("i", $user_id);
    if (!$deleteCart->execute()) throw new Exception("Lỗi thực thi truy vấn xóa giỏ hàng: " . $deleteCart->error);
    $deleteCart->close();

    $conn->commit();

    $response['success'] = true;
    $response['message'] = 'Thanh toán thành công. Đơn hàng của bạn đã được tạo.';
} catch (Exception $e) {
    $conn->rollback();
    $response['message'] = 'Lỗi thanh toán: ' . $e->getMessage();
}

echo json_encode($response);
$conn->close();
?>
