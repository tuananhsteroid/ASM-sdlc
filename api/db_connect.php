<?php
// api/db_connect.php

$servername = "localhost";
$username = "root";
$password = ""; // Mật khẩu của bạn, thường là rỗng trên XAMPP
$database = "sdlc1"; // Tên database của bạn

// Tạo kết nối
$conn = new mysqli($servername, $username, $password, $database);

// Kiểm tra kết nối
if ($conn->connect_error) {
    // Dừng lại và báo lỗi nếu kết nối thất bại
    http_response_code(500); // Lỗi server
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

// Thiết lập UTF-8 để hỗ trợ tiếng Việt
$conn->set_charset("utf8mb4");
?>