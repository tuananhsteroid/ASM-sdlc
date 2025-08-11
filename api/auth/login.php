<?php
session_start();


header("Content-Type: application/json; charset=UTF-8");

include_once __DIR__.'/../db_connect.php';


$data = json_decode(file_get_contents("php://input"));
$email = $data->email ?? '';
$pass = $data->password ?? '';

// Hàm kiểm tra đăng nhập cho một bảng và vai trò cụ thể
function attempt_login($conn, $table, $email, $pass, $role) {
    $user_id_field = ''; // Biến để lưu tên trường ID

    if ($table === 'employees') {
        $sql = "SELECT EmployeeID, FullName, Email, Password, PhoneNumber FROM employees WHERE Email = ? AND Role = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $email, $role);
        $user_id_field = 'EmployeeID';
    } elseif ($table === 'CustomerAccounts') {
        $sql = "SELECT CustomerID, FullName, Email, Password, PhoneNumber FROM CustomerAccounts WHERE Email = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $email);
        $user_id_field = 'CustomerID';
    } elseif ($table === 'AdminAccounts') {
        // Thêm trường hợp cho AdminAccounts
        $sql = "SELECT AdminID, FullName, Email, Password FROM AdminAccounts WHERE Email = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $email);
        $user_id_field = 'AdminID';
    } else {
        // Dòng code này có thể gây lỗi nếu tên trường ID không chuẩn
        $sql = "SELECT * FROM $table WHERE Email = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $email);
    }

    if ($stmt === false) {
        return null;
    }

    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        if (password_verify($pass, $user['Password'])) {
            $_SESSION['user_id'] = $user[$user_id_field]; // Sửa lỗi: lấy đúng trường ID
            $_SESSION['role'] = $role;
            $_SESSION['email'] = $user['Email'];
            $_SESSION['fullname'] = $user['FullName'];
            $_SESSION['phone'] = $user['PhoneNumber'] ?? null;
            
            return [
                'user_id' => $_SESSION['user_id'],
                'role' => $role,
                'email' => $user['Email'],
                'fullname' => $user['FullName'],
                'phone' => $_SESSION['phone']
            ];
        }
    }
    $stmt->close();
    return null;
}

// Thử đăng nhập với các vai trò theo thứ tự ưu tiên
$loggedInUser = attempt_login($conn, 'AdminAccounts', $email, $pass, 'admin');

if (!$loggedInUser) {
    $loggedInUser = attempt_login($conn, 'employees', $email, $pass, 'Shipper');
}

if (!$loggedInUser) {
    $loggedInUser = attempt_login($conn, 'CustomerAccounts', $email, $pass, 'customer');
}

$conn->close();

if ($loggedInUser) {
    http_response_code(200);
    echo json_encode(["success" => true, "user" => $loggedInUser]);
} else {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Email hoặc mật khẩu không chính xác."]);
}
exit();
?>