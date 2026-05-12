<?php
require_once __DIR__ . '/base.php';
$user   = require_auth();
$method = method();
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

// GET — list all or typeahead search (all authenticated users)
if ($method === 'GET') {
    $q = trim($_GET['q'] ?? '');
    if ($q) {
        $stmt = db()->prepare('
            SELECT id, name, contact_person, phone, email, address
            FROM customers WHERE active = 1 AND name LIKE ?
            ORDER BY name LIMIT 20
        ');
        $stmt->execute(['%' . $q . '%']);
    } else {
        $stmt = db()->query('
            SELECT c.id, c.name, c.contact_person, c.phone, c.email, c.address,
                   COUNT(q.id) AS quote_count
            FROM customers c
            LEFT JOIN quotes q ON q.customer_id = c.id
            WHERE c.active = 1
            GROUP BY c.id
            ORDER BY c.name
        ');
    }
    json_ok($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// Write operations — admin only
if ($user['role'] !== 'admin') json_error('Forbidden.', 403);

// POST — create
if ($method === 'POST') {
    $b    = body();
    $name = trim($b['name'] ?? '');
    if (!$name) json_error('Name is required.');

    $chk = db()->prepare('SELECT id FROM customers WHERE name = ? AND active = 1');
    $chk->execute([$name]);
    if ($chk->fetch()) json_error('A customer with that name already exists.');

    db()->prepare('INSERT INTO customers (name, contact_person, phone, email, address) VALUES (?,?,?,?,?)')
        ->execute([$name, $b['contact_person'] ?? null, $b['phone'] ?? null, $b['email'] ?? null, $b['address'] ?? null]);
    json_ok(['id' => (int)db()->lastInsertId()], 201);
}

// PUT ?id=N — update
if ($method === 'PUT' && $id) {
    $b    = body();
    $name = trim($b['name'] ?? '');
    if (!$name) json_error('Name is required.');

    $chk = db()->prepare('SELECT id FROM customers WHERE name = ? AND id != ? AND active = 1');
    $chk->execute([$name, $id]);
    if ($chk->fetch()) json_error('Another customer already has that name.');

    db()->prepare('UPDATE customers SET name=?, contact_person=?, phone=?, email=?, address=? WHERE id=?')
        ->execute([$name, $b['contact_person'] ?? null, $b['phone'] ?? null, $b['email'] ?? null, $b['address'] ?? null, $id]);
    json_ok();
}

// DELETE ?id=N — soft delete with quote guard
if ($method === 'DELETE' && $id) {
    $cnt = db()->prepare('SELECT COUNT(*) FROM quotes WHERE customer_id = ?');
    $cnt->execute([$id]);
    if ((int)$cnt->fetchColumn() > 0) json_error('This customer has quotes and cannot be deleted. Remove the quotes first.');

    db()->prepare('UPDATE customers SET active = 0 WHERE id = ?')->execute([$id]);
    json_ok();
}

json_error('Not found.', 404);
