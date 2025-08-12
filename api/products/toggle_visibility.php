<?php
header('Content-Type: application/json');
include_once __DIR__.'/../db_connect.php';

$response = ['success' => false, 'message' => ''];

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = isset($data['id']) ? intval($data['id']) : 0;
    $status = isset($data['status']) ? trim($data['status']) : '';

    if ($id <= 0 || ($status !== 'hidden' && $status !== 'active')) {
        throw new Exception('Dữ liệu không hợp lệ.');
    }

    // Thử cập nhật theo cột Status (ENUM/VARCHAR)
    $stmt = $conn->prepare("UPDATE products SET Status = ? WHERE ProductID = ?");
    if ($stmt) {
        $stmt->bind_param('si', $status, $id);
        if ($stmt->execute()) {
            $response['success'] = true;
            $response['message'] = 'Cập nhật trạng thái sản phẩm thành công.';
            echo json_encode($response);
            $stmt->close();
            $conn->close();
            exit;
        }
        $stmt->close();
    }

    // Fallback: thử cập nhật theo cột IsHidden (0/1)
    $isHidden = ($status === 'hidden') ? 1 : 0;
    $stmt2 = $conn->prepare("UPDATE products SET IsHidden = ? WHERE ProductID = ?");
    if ($stmt2) {
        $stmt2->bind_param('ii', $isHidden, $id);
        if ($stmt2->execute()) {
            $response['success'] = true;
            $response['message'] = 'Cập nhật trạng thái sản phẩm thành công.';
            echo json_encode($response);
            $stmt2->close();
            $conn->close();
            exit;
        }
        $stmt2->close();
    }

    throw new Exception('Không thể cập nhật trạng thái (thiếu cột Status/IsHidden?).');

} catch (Exception $e) {
    $response['message'] = $e->getMessage();
    echo json_encode($response);
} finally {
    $conn->close();
}