<?php
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__.'/../db_connect.php';

$result = $conn->query("SELECT EmployeeID, FullName, Email, PhoneNumber, Role, CreatedAt FROM employees ORDER BY EmployeeID DESC");
$employees = $result->fetch_all(MYSQLI_ASSOC);
$conn->close();
echo json_encode($employees);
?>