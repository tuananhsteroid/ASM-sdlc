<?php
// api/employees/read_one.php

header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__.'/../db_connect.php'; 

$id = intval($_GET['id'] ?? 0);
$employee = null;

if ($id > 0) {
    // Lưu ý: Không lấy mật khẩu ra để đảm bảo an toàn
    $stmt = $conn->prepare("SELECT EmployeeID, FullName, Email, PhoneNumber, Role FROM employees WHERE EmployeeID = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $employee = $result->fetch_assoc();
    $stmt->close();
}

$conn->close();
echo json_encode($employee);
?>