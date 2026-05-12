<?php
require_once __DIR__ . '/base.php';

$action = $_GET['action'] ?? '';

switch ($action) {

    // POST /api/auth.php?action=login
    case 'login':
        if (method() !== 'POST') json_error('Method not allowed.', 405);

        $b    = body();
        $user = trim($b['username'] ?? '');
        $pass = $b['password'] ?? '';

        if (!$user || !$pass) json_error('Username and password are required.');

        $row = db()->prepare('SELECT id, username, password_hash, full_name, role FROM users WHERE username = ? AND active = 1');
        $row->execute([$user]);
        $row = $row->fetch();

        if (!$row || !password_verify($pass, $row['password_hash'])) {
            json_error('Invalid credentials.', 401);
        }

        // Regenerate session ID on login
        session_regenerate_id(true);
        $_SESSION['user'] = [
            'id'        => $row['id'],
            'username'  => $row['username'],
            'full_name' => $row['full_name'],
            'role'      => $row['role'],
        ];

        json_ok([
            'id'        => $row['id'],
            'username'  => $row['username'],
            'full_name' => $row['full_name'],
            'role'      => $row['role'],
        ]);

    // POST /api/auth.php?action=logout
    case 'logout':
        session_unset();
        session_destroy();
        json_ok();

    // GET /api/auth.php?action=check
    case 'check':
        if (empty($_SESSION['user'])) json_error('Not authenticated.', 401);
        json_ok($_SESSION['user']);

    // POST /api/auth.php?action=change_password  (for logged-in user)
    case 'change_password':
        $user = require_auth();
        if (method() !== 'POST') json_error('Method not allowed.', 405);

        $b       = body();
        $current = $b['current_password'] ?? '';
        $new     = $b['new_password']     ?? '';

        if (!$current || !$new) json_error('Both current and new password are required.');
        if (strlen($new) < 8)   json_error('New password must be at least 8 characters.');

        $row = db()->prepare('SELECT password_hash FROM users WHERE id = ?');
        $row->execute([$user['id']]);
        $row = $row->fetch();

        if (!$row || !password_verify($current, $row['password_hash'])) {
            json_error('Current password is incorrect.', 401);
        }

        $hash = password_hash($new, PASSWORD_BCRYPT, ['cost' => 12]);
        db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $user['id']]);
        json_ok();

    default:
        json_error('Unknown action.', 404);
}
