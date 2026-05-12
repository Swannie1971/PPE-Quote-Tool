<?php
require_once __DIR__ . '/base.php';
$user = require_auth();

$method = method();
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

// GET /api/pricing.php              — all active items
// GET /api/pricing.php?q=search     — search items (live search for BOM builder)
// GET /api/pricing.php?id=N         — single item
// POST /api/pricing.php             — create item (admin)
// PUT /api/pricing.php?id=N         — update item (admin)
// DELETE /api/pricing.php?id=N      — deactivate item (admin)

if ($method === 'GET' && !$id) {
    $q    = trim($_GET['q'] ?? '');
    $cat  = trim($_GET['cat'] ?? '');
    $sql  = 'SELECT * FROM pricing_items WHERE active = 1';
    $args = [];

    if ($q) {
        $sql  .= ' AND (item_code LIKE ? OR description LIKE ? OR supplier LIKE ?)';
        $like  = "%$q%";
        $args  = [$like, $like, $like];
    }
    if ($cat && $cat !== 'all') {
        $sql  .= ' AND category = ?';
        $args[] = $cat;
    }
    $sql .= ' ORDER BY category, item_code LIMIT 200';

    $stmt = db()->prepare($sql);
    $stmt->execute($args);
    json_ok($stmt->fetchAll());
}

if ($method === 'GET' && $id) {
    $row = db()->prepare('SELECT * FROM pricing_items WHERE id = ?');
    $row->execute([$id]);
    $item = $row->fetch();
    if (!$item) json_error('Item not found.', 404);
    json_ok($item);
}

if ($method === 'POST' && isset($_GET['_bulk'])) {
    require_admin();
    $b    = body();
    $rows = is_array($b['items'] ?? null) ? $b['items'] : [];
    if (empty($rows)) json_error('No items provided.');

    $validCats  = ['enclosure','protection','copper','internal','wiring','automation','metering','misc'];
    $validUnits = ['ea','m','kg','set','lot','hr'];

    $find   = db()->prepare('SELECT id FROM pricing_items WHERE item_code = ? AND item_code != \'\' AND active = 1 LIMIT 1');
    $upd    = db()->prepare('UPDATE pricing_items SET description=?,category=?,supplier=?,unit=?,cost_price=?,default_markup=?,lead_time=?,stock_status=?,active=1 WHERE id=?');
    $ins    = db()->prepare('INSERT INTO pricing_items (item_code,description,category,supplier,unit,cost_price,sell_price,default_markup,lead_time,stock_status) VALUES (?,?,?,?,?,?,NULL,?,?,?)');

    $inserted = $updated = 0;
    foreach ($rows as $row) {
        $desc  = trim($row['description'] ?? '');
        if (!$desc) continue;
        $code  = trim($row['item_code']       ?? '');
        $cat   = in_array($row['category']    ?? '', $validCats)  ? $row['category']  : 'misc';
        $unit  = in_array($row['unit']        ?? '', $validUnits) ? $row['unit']      : 'ea';
        $cost  = (float)($row['cost_price']     ?? 0);
        $mkup  = (float)($row['default_markup'] ?? 30);
        $lead  = trim($row['lead_time']    ?? '') ?: null;
        $stock = trim($row['stock_status'] ?? '') ?: null;
        $supp  = trim($row['supplier']     ?? '') ?: null;

        $existId = null;
        if ($code) {
            $find->execute([$code]);
            $ex = $find->fetch(PDO::FETCH_ASSOC);
            if ($ex) $existId = $ex['id'];
        }
        if ($existId) {
            $upd->execute([$desc, $cat, $supp, $unit, $cost, $mkup, $lead, $stock, $existId]);
            $updated++;
        } else {
            $ins->execute([$code, $desc, $cat, $supp, $unit, $cost, $mkup, $lead, $stock]);
            $inserted++;
        }
    }
    json_ok(['inserted' => $inserted, 'updated' => $updated]);
}

if ($method === 'POST') {
    require_admin();
    $b = body();
    db()->prepare('
        INSERT INTO pricing_items (item_code, description, category, supplier, unit, cost_price, sell_price, default_markup, lead_time, stock_status)
        VALUES (?,?,?,?,?,?,?,?,?,?)
    ')->execute([
        $b['item_code']      ?? '',
        $b['description']    ?? '',
        $b['category']       ?? 'misc',
        $b['supplier']       ?? null,
        $b['unit']           ?? 'ea',
        (float)($b['cost_price']     ?? 0),
        isset($b['sell_price']) ? (float)$b['sell_price'] : null,
        (float)($b['default_markup'] ?? 30),
        $b['lead_time']      ?? null,
        $b['stock_status']   ?? null,
    ]);
    json_ok(['id' => (int)db()->lastInsertId()], 201);
}

if ($method === 'PUT' && $id) {
    require_admin();
    $b = body();
    db()->prepare('
        UPDATE pricing_items SET
            item_code      = ?, description    = ?, category    = ?,
            supplier       = ?, unit           = ?, cost_price  = ?,
            sell_price     = ?, default_markup = ?, lead_time   = ?,
            stock_status   = ?, active         = ?
        WHERE id = ?
    ')->execute([
        $b['item_code'],
        $b['description'],
        $b['category'],
        $b['supplier']       ?? null,
        $b['unit'],
        (float)($b['cost_price']     ?? 0),
        isset($b['sell_price']) ? (float)$b['sell_price'] : null,
        (float)($b['default_markup'] ?? 30),
        $b['lead_time']      ?? null,
        $b['stock_status']   ?? null,
        (int)($b['active']   ?? 1),
        $id,
    ]);
    json_ok();
}

if ($method === 'POST' && isset($_GET['_delete'])) {
    require_admin();
    $b   = body();
    $ids = is_array($b['ids'] ?? null) ? array_map('intval', $b['ids']) : [];
    if (empty($ids)) json_error('No IDs provided.');
    $ph  = implode(',', array_fill(0, count($ids), '?'));
    db()->prepare("UPDATE pricing_items SET active = 0 WHERE id IN ($ph)")->execute($ids);
    json_ok(['deleted' => count($ids)]);
}

if ($method === 'DELETE' && $id) {
    require_admin();
    db()->prepare('UPDATE pricing_items SET active = 0 WHERE id = ?')->execute([$id]);
    json_ok();
}

json_error('Not found.', 404);
