<?php
// Tên file: api/customers/read.php
header("Content-Type: application/json; charset=UTF-8");

// Thông tin kết nối cơ sở dữ liệu
$servername = "localhost";
$username = "root";
$password = "";
$database = "sdlc1";

// Tạo kết nối
$conn = new mysqli($servername, $username, $password, $database);

// Kiểm tra kết nối
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["message" => "Lỗi kết nối CSDL: " . $conn->connect_error]);
    exit();
}

$conn->set_charset("utf8mb4");

// Chuẩn bị và thực thi câu lệnh SQL
$sql = "SELECT CustomerID, FullName, Email, PhoneNumber, Address FROM customeraccounts";
$result = $conn->query($sql);

$customers = [];
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $customers[] = $row;
    }
}

// Trả về dữ liệu dưới dạng JSON
http_response_code(200);
echo json_encode($customers);

$conn->close();
?>