<?php
require_once __DIR__ . '/base.php';
$me = require_admin();

$method = method();
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;
$action = $_GET['action'] ?? '';

// GET — list all users
if ($method === 'GET') {
    $rows = db()->query('SELECT id, username, full_name, role, active, created_at FROM users ORDER BY created_at ASC')
                ->fetchAll(PDO::FETCH_ASSOC);
    json_ok($rows);
}

// POST ?action=set_password&id=N — admin resets any user's password
if ($method === 'POST' && $action === 'set_password' && $id) {
    $b    = body();
    $pass = trim($b['password'] ?? '');
    if (strlen($pass) < 8) json_error('Password must be at least 8 characters.');
    $hash = password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12]);
    db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $id]);
    json_ok();
}

// POST — create user
if ($method === 'POST') {
    $b         = body();
    $username  = trim($b['username']  ?? '');
    $full_name = trim($b['full_name'] ?? '');
    $role      = in_array($b['role'] ?? '', ['admin','estimator']) ? $b['role'] : 'estimator';
    $pass      = $b['password'] ?? '';

    if (!$username || !$full_name) json_error('Username and full name are required.');
    if (strlen($pass) < 8)        json_error('Password must be at least 8 characters.');

    $chk = db()->prepare('SELECT id FROM users WHERE username = ?');
    $chk->execute([$username]);
    if ($chk->fetch()) json_error('Username already exists.');

    $hash = password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12]);
    db()->prepare('INSERT INTO users (username, password_hash, full_name, role) VALUES (?,?,?,?)')
        ->execute([$username, $hash, $full_name, $role]);
    json_ok(['id' => (int)db()->lastInsertId()], 201);
}

// PUT ?id=N — update details
if ($method === 'PUT' && $id) {
    $b         = body();
    $full_name = trim($b['full_name'] ?? '');
    $username  = trim($b['username']  ?? '');
    $role      = in_array($b['role'] ?? '', ['admin','estimator']) ? $b['role'] : 'estimator';
    $active    = isset($b['active']) ? (int)(bool)$b['active'] : 1;

    if (!$full_name || !$username) json_error('Name and username are required.');
    if ($id === (int)$me['id'] && !$active) json_error('You cannot deactivate your own account.');

    $chk = db()->prepare('SELECT id FROM users WHERE username = ? AND id != ?');
    $chk->execute([$username, $id]);
    if ($chk->fetch()) json_error('Username already taken by another user.');

    db()->prepare('UPDATE users SET full_name=?, username=?, role=?, active=? WHERE id=?')
        ->execute([$full_name, $username, $role, $active, $id]);
    json_ok();
}

json_error('Not found.', 404);
