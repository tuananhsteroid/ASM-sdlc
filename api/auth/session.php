<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");


include_once __DIR__.'/../db_connect.php';


// Kiểm tra lỗi kết nối
if ($conn->connect_error) {
    echo json_encode([
        "success" => false,
        "loggedIn" => false,
        "message" => "Lỗi kết nối CSDL: " . $conn->connect_error
    ]);
    exit();
}

// Mặc định là chưa đăng nhập
$response = [
    "success" => true,
    "loggedIn" => false,
    "user" => null,
    "cartCount" => 0
];

// Kiểm tra nếu đã đăng nhập
if (
    isset($_SESSION['user_id']) &&
    isset($_SESSION['role']) &&
    isset($_SESSION['email']) &&
    isset($_SESSION['fullname'])
) {
    $response['loggedIn'] = true;
    $response['user'] = [
        'user_id' => $_SESSION['user_id'],
        'role' => $_SESSION['role'],
        'email' => $_SESSION['email'],
        'fullname' => $_SESSION['fullname'],
        'phone' => $_SESSION['phone'] ?? null
    ];

    // Nếu là khách hàng, đếm số lượng sản phẩm trong giỏ
    if ($_SESSION['role'] === 'customer') {
        $stmt = $conn->prepare("
            SELECT SUM(ci.Quantity)
            FROM cart_items ci
            WHERE ci.CustomerID = ?
        ");

        if ($stmt) {
            $stmt->bind_param("i", $_SESSION['user_id']);
            $stmt->execute();
            $stmt->bind_result($cartCount);
            $stmt->fetch();
            $stmt->close();
            $response['cartCount'] = $cartCount ?? 0;
        } else {
            $response['cartCount'] = 0;
        }
    }
}

$conn->close();
echo json_encode($response);
exit();
