<?php
// Logo upload / delete endpoint
// POST (multipart): upload a new logo — admin only
// DELETE:           remove the logo — admin only

require_once __DIR__ . '/base.php';
$user = require_auth();

$assetsDir = __DIR__ . '/../assets';
if (!is_dir($assetsDir)) mkdir($assetsDir, 0755, true);

$logoBase = $assetsDir . '/logo';
$allowed  = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/svg+xml' => 'svg', 'image/webp' => 'webp'];

if (method() === 'POST') {
    if ($user['role'] !== 'admin') json_error('Admin only.', 403);
    if (empty($_FILES['logo']))    json_error('No file received.');

    $f = $_FILES['logo'];
    if ($f['error'] !== UPLOAD_ERR_OK)   json_error('Upload error ' . $f['error'] . '.');
    if ($f['size'] > 2 * 1024 * 1024)   json_error('Logo must be under 2 MB.');

    $mime = mime_content_type($f['tmp_name']);
    if (!isset($allowed[$mime]))         json_error('Unsupported type. Use PNG, JPG, SVG or WebP.');
    $ext = $allowed[$mime];

    // Remove any previous logo
    foreach (array_values($allowed) as $e) {
        $old = $logoBase . '.' . $e;
        if (file_exists($old)) unlink($old);
    }

    if (!move_uploaded_file($f['tmp_name'], $logoBase . '.' . $ext))
        json_error('Could not save file — check folder permissions.');

    db()->prepare("INSERT INTO settings (`key`, `value`) VALUES ('company_logo', ?) ON DUPLICATE KEY UPDATE `value` = ?")
       ->execute([$ext, $ext]);

    json_ok(['ext' => $ext]);
}

if (method() === 'DELETE') {
    if ($user['role'] !== 'admin') json_error('Admin only.', 403);

    foreach (array_values($allowed) as $e) {
        $f = $logoBase . '.' . $e;
        if (file_exists($f)) unlink($f);
    }
    db()->prepare("DELETE FROM settings WHERE `key` = 'company_logo'")->execute();
    json_ok();
}

json_error('Method not allowed.', 405);
