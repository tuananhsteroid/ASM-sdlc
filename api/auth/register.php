<?php
header("Content-Type: application/json; charset=UTF-8");

// Kiểm tra phương thức yêu cầu, chỉ chấp nhận POST.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Method Not Allowed."]);
    exit();
}

// Thông tin kết nối cơ sở dữ liệu
$servername = "localhost";
$username = "root"; 
$password = "";    
$database = "sdlc1"; 

// Tạo kết nối
$conn = new mysqli($servername, $username, $password, $database);

// Kiểm tra kết nối và hiển thị lỗi chi tiết nếu có
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["message" => "Lỗi kết nối CSDL: " . $conn->connect_error]);
    exit();
}

// Thiết lập UTF-8 để hỗ trợ tiếng Việt
$conn->set_charset("utf8mb4");

// Lấy dữ liệu từ yêu cầu POST
$data = json_decode(file_get_contents("php://input"));

// Kiểm tra xem tất cả các trường cần thiết có được cung cấp không
$required_fields = ['fullName', 'email', 'phone', 'address', 'dateOfBirth', 'password'];
foreach ($required_fields as $field) {
    if (!isset($data->$field) || empty(trim($data->$field))) {
        http_response_code(400);
        echo json_encode(["message" => "Thiếu thông tin đăng ký. Vui lòng điền đầy đủ các trường."]);
        exit();
    }
}

$fullName = $conn->real_escape_string(trim($data->fullName));
$email = $conn->real_escape_string(trim($data->email));
$phone = $conn->real_escape_string(trim($data->phone));
$address = $conn->real_escape_string(trim($data->address));
$dateOfBirth = $conn->real_escape_string(trim($data->dateOfBirth));
$password = $conn->real_escape_string($data->password);

// --- BƯỚC 1: KIỂM TRA TÍNH HỢP LỆ CỦA DỮ LIỆU ---

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["message" => "Định dạng email không hợp lệ."]);
    exit();
}

// Biểu thức chính quy kiểm tra mật khẩu
$passwordPattern = "/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]).{8,}$/";
if (!preg_match($passwordPattern, $password)) {
    http_response_code(400);
    echo json_encode(["message" => "Mật khẩu phải có ít nhất 8 ký tự, bao gồm ít nhất một chữ cái viết hoa, một chữ số và một ký tự đặc biệt."]);
    exit();
}

// Kiểm tra định dạng ngày sinh hợp lệ
if (!DateTime::createFromFormat('Y-m-d', $dateOfBirth)) {
    http_response_code(400);
    echo json_encode(["message" => "Định dạng ngày sinh không hợp lệ."]);
    exit();
}

// --- BƯỚC 2: KIỂM TRA EMAIL ĐÃ TỒN TẠI CHƯA ---

$checkEmailQuery = "SELECT CustomerID FROM customeraccounts WHERE Email = ?";
$stmt = $conn->prepare($checkEmailQuery);
if ($stmt === false) {
    http_response_code(500);
    echo json_encode(["message" => "Lỗi chuẩn bị câu lệnh SELECT: " . $conn->error]);
    exit();
}
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    http_response_code(409); // Conflict
    echo json_encode(["message" => "Email này đã được sử dụng. Vui lòng chọn một email khác."]);
    $stmt->close();
    $conn->close();
    exit();
}
$stmt->close();

// --- BƯỚC 3: HASH MẬT KHẨU VÀ CHÈN VÀO CƠ SỞ DỮ LIỆU ---

// Hash mật khẩu an toàn
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

$insertQuery = "INSERT INTO customeraccounts (FullName, Email, PhoneNumber, Address, DateOfBirth, Password) VALUES (?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($insertQuery);
if ($stmt === false) {
    http_response_code(500);
    echo json_encode(["message" => "Lỗi chuẩn bị câu lệnh INSERT: " . $conn->error]);
    exit();
}

$stmt->bind_param("ssssss", $fullName, $email, $phone, $address, $dateOfBirth, $hashedPassword);

// Thực thi câu lệnh
if ($stmt->execute()) {
    http_response_code(201); // Created
    echo json_encode(["message" => "Đăng ký thành công!", "CustomerID" => $stmt->insert_id]);
} else {
    http_response_code(500); // Internal Server Error
    echo json_encode(["message" => "Đăng ký không thành công. Lỗi: " . $stmt->error]);
}

// Đóng kết nối
$stmt->close();
$conn->close();
?>