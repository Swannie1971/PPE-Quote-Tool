<?php
require_once __DIR__ . '/base.php';

// GET — public (needed before login for company name on login screen)
// POST — admin only

if (method() === 'GET') {
    $rows = db()->query("SELECT `key`, `value` FROM settings ORDER BY `key`")->fetchAll(PDO::FETCH_KEY_PAIR);
    // Never expose DB credentials or internal keys
    $safe = array_filter($rows, fn($k) => !str_starts_with($k, 'db_'), ARRAY_FILTER_USE_KEY);
    json_ok($safe);
}

require_once __DIR__ . '/base.php';
require_admin();

if (method() === 'POST') {
    $b    = body();
    $stmt = db()->prepare("INSERT INTO settings (`key`, `value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)");
    foreach ($b as $key => $val) {
        if (preg_match('/^[a-z_]{1,80}$/', $key)) {
            $stmt->execute([$key, (string)$val]);
        }
    }
    json_ok();
}

json_error('Not found.', 404);
