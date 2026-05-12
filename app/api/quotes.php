<?php
require_once __DIR__ . '/base.php';
$user = require_auth();

$method = method();
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function next_quote_number(): string {
    $db     = db();
    $prefix = $db->query("SELECT `value` FROM settings WHERE `key` = 'quote_prefix'")->fetchColumn() ?: 'PQ';
    $year   = date('Y');

    // Lock the row so concurrent requests don't get the same number
    $db->beginTransaction();
    $row = $db->query("SELECT `value` FROM settings WHERE `key` = 'quote_next_number' FOR UPDATE")->fetchColumn();
    $seq = (int)($row ?: 1);
    $db->prepare("UPDATE settings SET `value` = ? WHERE `key` = 'quote_next_number'")->execute([$seq + 1]);
    $db->commit();

    return sprintf('%s-%s-%04d', $prefix, $year, $seq);
}

function fetch_quote(int $id): array {
    $db = db();

    $q = $db->prepare('
        SELECT q.*,
               c.name            AS customer_name,
               c.contact_person,
               c.phone,
               c.email,
               c.address,
               u.full_name       AS estimator_name,
               ub.full_name      AS updated_by_name
        FROM quotes q
        LEFT JOIN customers c  ON c.id  = q.customer_id
        LEFT JOIN users     u  ON u.id  = q.estimator_id
        LEFT JOIN users     ub ON ub.id = q.updated_by
        WHERE q.id = ?
    ');
    $q->execute([$id]);
    $quote = $q->fetch();
    if (!$quote) return [];

    $pan = $db->prepare('SELECT id, name, description, qty, sort_order FROM quote_panels WHERE quote_id = ? ORDER BY sort_order, id');
    $pan->execute([$id]);
    $quote['panels'] = $pan->fetchAll();

    $bom = $db->prepare('SELECT * FROM quote_bom    WHERE quote_id = ? ORDER BY sort_order, id');
    $bom->execute([$id]);
    $quote['bom'] = $bom->fetchAll();

    $lab = $db->prepare('SELECT * FROM quote_labour WHERE quote_id = ? ORDER BY sort_order, id');
    $lab->execute([$id]);
    $quote['labour'] = $lab->fetchAll();

    $cu = $db->prepare('SELECT * FROM quote_copper  WHERE quote_id = ? ORDER BY sort_order, id');
    $cu->execute([$id]);
    $quote['copper'] = $cu->fetchAll();

    return $quote;
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/quotes.php            — list all quotes (summary)
// GET /api/quotes.php?id=N       — single quote with BOM/labour/copper
// POST /api/quotes.php           — create new quote
// PUT /api/quotes.php?id=N       — update quote header
// DELETE /api/quotes.php?id=N    — delete quote
// POST /api/quotes.php?id=N&action=save_full   — save full quote (header + all lines)
// POST /api/quotes.php?id=N&action=set_status  — update status only

$action = $_GET['action'] ?? '';

if ($method === 'GET' && !$id) {
    // List — summary rows for dashboard table
    $rows = db()->query('
        SELECT q.id, q.quote_number, q.project_name, q.status, q.quote_date, q.vat_rate, q.updated_at,
               c.name AS customer_name,
               u.full_name  AS estimator_name,
               ub.full_name AS updated_by_name,
               (SELECT COALESCE(SUM(qty * cost_price * (1 + markup_pct/100)),0) FROM quote_bom    WHERE quote_id = q.id) AS mat_sell,
               (SELECT COALESCE(SUM(hours * rate),0)                              FROM quote_labour WHERE quote_id = q.id) AS lab_cost,
               (SELECT COALESCE(SUM(hours * rate),0)*1.45                         FROM quote_labour WHERE quote_id = q.id) AS lab_sell
        FROM quotes q
        LEFT JOIN customers c  ON c.id  = q.customer_id
        LEFT JOIN users     u  ON u.id  = q.estimator_id
        LEFT JOIN users     ub ON ub.id = q.updated_by
        ORDER BY q.created_at DESC
    ')->fetchAll();

    // Add computed sell total for each row
    foreach ($rows as &$r) {
        $r['sell_total'] = round((float)$r['mat_sell'] + (float)$r['lab_sell'], 2);
        unset($r['mat_sell'], $r['lab_sell'], $r['lab_cost']);
    }
    json_ok($rows);
}

if ($method === 'GET' && $id) {
    $q = fetch_quote($id);
    if (!$q) json_error('Quote not found.', 404);
    json_ok($q);
}

if ($method === 'POST' && !$id) {
    // Create new blank quote
    $settings = db()->query("SELECT `key`, `value` FROM settings WHERE `key` IN ('default_vat_rate','default_validity')")->fetchAll(PDO::FETCH_KEY_PAIR);

    $num = next_quote_number();
    $db  = db();

    // Auto-create / find customer if name provided
    $b    = body();
    $cid  = null;
    $name = trim($b['customer_name'] ?? '');
    if ($name) {
        $row = $db->prepare('SELECT id FROM customers WHERE name = ? LIMIT 1');
        $row->execute([$name]);
        $cid = $row->fetchColumn() ?: null;
        if (!$cid) {
            $db->prepare('INSERT INTO customers (name) VALUES (?)')->execute([$name]);
            $cid = (int)$db->lastInsertId();
        }
    }

    $db->prepare('
        INSERT INTO quotes (quote_number, customer_id, project_name, estimator_id, quote_date, validity_days, vat_rate)
        VALUES (?,?,?,?,CURDATE(),?,?)
    ')->execute([
        $num,
        $cid,
        $b['project_name'] ?? 'New Project',
        $user['id'],
        (int)($settings['default_validity'] ?? 30),
        (float)($settings['default_vat_rate'] ?? 15),
    ]);
    $newId = (int)$db->lastInsertId();
    json_ok(fetch_quote($newId), 201);
}

if ($method === 'POST' && $id && $action === 'duplicate') {
    $db   = db();
    $orig = fetch_quote($id);
    if (!$orig) json_error('Quote not found.', 404);

    $newNum  = next_quote_number();
    $newName = trim($orig['project_name'] ?? 'New Project') . ' (Copy)';

    $db->beginTransaction();
    try {
        $db->prepare('
            INSERT INTO quotes (quote_number, customer_id, project_name, site_location, estimator_id,
                                quote_date, validity_days, currency, vat_rate, notes, exclusions, terms,
                                status, pdf_format)
            VALUES (?,?,?,?,?,CURDATE(),?,?,?,?,?,?,?,?)
        ')->execute([
            $newNum,
            $orig['customer_id']   ?? null,
            $newName,
            $orig['site_location'] ?? null,
            $user['id'],
            (int)($orig['validity_days'] ?? 30),
            $orig['currency']      ?? 'ZAR',
            (float)($orig['vat_rate'] ?? 15),
            $orig['notes']         ?? null,
            $orig['exclusions']    ?? null,
            $orig['terms']         ?? null,
            'draft',
            $orig['pdf_format']    ?? 'grouped',
        ]);
        $newId = (int)$db->lastInsertId();

        // Copy panels, building old_id → new_id map for line remapping
        $panelMap = [];
        foreach (($orig['panels'] ?? []) as $p) {
            $db->prepare('INSERT INTO quote_panels (quote_id, name, description, qty, sort_order) VALUES (?,?,?,?,?)')
               ->execute([$newId, $p['name'], $p['description'], $p['qty'], $p['sort_order']]);
            $panelMap[(int)$p['id']] = (int)$db->lastInsertId();
        }
        $rp = fn($pid) => $pid ? ($panelMap[(int)$pid] ?? null) : null;

        foreach (($orig['bom'] ?? []) as $line) {
            $db->prepare('
                INSERT INTO quote_bom (quote_id, panel_id, pricing_item_id, item_code, description,
                                       category, supplier, unit, qty, cost_price, markup_pct, notes,
                                       price_overridden, sort_order)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ')->execute([
                $newId, $rp($line['panel_id']), $line['pricing_item_id'],
                $line['item_code'], $line['description'], $line['category'], $line['supplier'],
                $line['unit'], $line['qty'], $line['cost_price'], $line['markup_pct'],
                $line['notes'], $line['price_overridden'], $line['sort_order'],
            ]);
        }

        foreach (($orig['labour'] ?? []) as $line) {
            $db->prepare('
                INSERT INTO quote_labour (quote_id, panel_id, category, skill_level, hours, rate, sort_order)
                VALUES (?,?,?,?,?,?,?)
            ')->execute([
                $newId, $rp($line['panel_id']),
                $line['category'], $line['skill_level'], $line['hours'], $line['rate'], $line['sort_order'],
            ]);
        }

        foreach (($orig['copper'] ?? []) as $run) {
            $db->prepare('
                INSERT INTO quote_copper (quote_id, panel_id, name, width_mm, height_mm, length_m, qty,
                                          price_per_m, waste_pct, fab_hours, fab_rate, tinned, markup_pct, sort_order)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ')->execute([
                $newId, $rp($run['panel_id']),
                $run['name'], $run['width_mm'], $run['height_mm'], $run['length_m'], $run['qty'],
                $run['price_per_m'], $run['waste_pct'], $run['fab_hours'], $run['fab_rate'],
                $run['tinned'], $run['markup_pct'], $run['sort_order'],
            ]);
        }

        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        throw $e;
    }

    json_ok(fetch_quote($newId), 201);
}

if ($method === 'POST' && $id && $action === 'save_full') {
    // Save entire quote in one request: header + bom + labour + copper
    $b  = body();
    $db = db();

    // Check quote exists
    $exists = $db->prepare('SELECT id FROM quotes WHERE id = ?');
    $exists->execute([$id]);
    if (!$exists->fetchColumn()) json_error('Quote not found.', 404);

    $db->beginTransaction();
    try {
        // 1. Customer upsert
        $cid  = null;
        $name = trim($b['customer_name'] ?? '');
        if ($name) {
            $existing = $db->prepare('SELECT id FROM customers WHERE name = ? LIMIT 1');
            $existing->execute([$name]);
            $cid = $existing->fetchColumn() ?: null;
            if (!$cid) {
                $db->prepare('INSERT INTO customers (name, contact_person, phone, email, address) VALUES (?,?,?,?,?)')->execute([
                    $name,
                    $b['contact_person'] ?? null,
                    $b['phone']          ?? null,
                    $b['email']          ?? null,
                    $b['address']        ?? null,
                ]);
                $cid = (int)$db->lastInsertId();
            } else {
                $db->prepare('UPDATE customers SET contact_person=?, phone=?, email=?, address=? WHERE id=?')->execute([
                    $b['contact_person'] ?? null,
                    $b['phone']          ?? null,
                    $b['email']          ?? null,
                    $b['address']        ?? null,
                    $cid,
                ]);
            }
        }

        // 2. Quote header
        $db->prepare('
            UPDATE quotes SET
                customer_id   = ?,
                project_name  = ?,
                site_location = ?,
                estimator_id  = ?,
                quote_date    = ?,
                validity_days = ?,
                currency      = ?,
                vat_rate      = ?,
                status        = ?,
                notes         = ?,
                exclusions    = ?,
                terms         = ?,
                pdf_format    = ?,
                updated_by    = ?
            WHERE id = ?
        ')->execute([
            $cid,
            $b['project_name']  ?? '',
            $b['site_location'] ?? null,
            $user['id'],
            $b['quote_date']    ?? date('Y-m-d'),
            (int)($b['validity_days'] ?? 30),
            $b['currency']      ?? 'ZAR',
            (float)($b['vat_rate'] ?? 15),
            in_array($b['status'] ?? '', ['draft','sent','won','lost']) ? $b['status'] : 'draft',
            $b['notes']         ?? null,
            $b['exclusions']    ?? null,
            $b['terms']         ?? null,
            $b['pdf_format']    ?? 'grouped',
            $user['id'],
            $id,
        ]);

        // 3. Panels — upsert (UPDATE existing, INSERT new)
        // Build a map of frontend_id → real_db_id for panel_id resolution on lines
        $panelIdMap = [];
        $keepPanelIds = [];
        foreach (($b['panels'] ?? []) as $i => $panel) {
            $fid  = (string)($panel['id'] ?? '');
            $name = trim($panel['name'] ?? '');
            $desc = $panel['description'] ?? null;
            $qty  = max(1, (int)($panel['qty'] ?? 1));
            if (is_numeric($fid) && (int)$fid > 0) {
                $dbId = (int)$fid;
                $db->prepare('UPDATE quote_panels SET name=?, description=?, qty=?, sort_order=? WHERE id=? AND quote_id=?')
                   ->execute([$name, $desc, $qty, $i, $dbId, $id]);
                $panelIdMap[$fid] = $dbId;
                $keepPanelIds[]   = $dbId;
            } else {
                $db->prepare('INSERT INTO quote_panels (quote_id, name, description, qty, sort_order) VALUES (?,?,?,?,?)')
                   ->execute([$id, $name, $desc, $qty, $i]);
                $dbId = (int)$db->lastInsertId();
                $panelIdMap[$fid] = $dbId;
                $keepPanelIds[]   = $dbId;
            }
        }
        // Delete panels no longer in the list
        if (!empty($keepPanelIds)) {
            $ph = implode(',', array_fill(0, count($keepPanelIds), '?'));
            $db->prepare("DELETE FROM quote_panels WHERE quote_id = ? AND id NOT IN ($ph)")
               ->execute(array_merge([$id], $keepPanelIds));
        } else {
            $db->prepare('DELETE FROM quote_panels WHERE quote_id = ?')->execute([$id]);
        }

        // Helper: resolve a frontend panel_id to a real DB id (or null)
        $resolvePanelId = function($raw) use ($panelIdMap) {
            if (!$raw) return null;
            $s = (string)$raw;
            if (isset($panelIdMap[$s])) return $panelIdMap[$s];
            if (is_numeric($s) && (int)$s > 0) return (int)$s;
            return null;
        };

        // 4. BOM — replace all lines
        $db->prepare('DELETE FROM quote_bom WHERE quote_id = ?')->execute([$id]);
        $bomStmt = $db->prepare('
            INSERT INTO quote_bom (quote_id, panel_id, pricing_item_id, item_code, description, category, supplier, unit, qty, cost_price, markup_pct, notes, price_overridden, sort_order)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ');
        foreach (($b['bom'] ?? []) as $i => $line) {
            $bomStmt->execute([
                $id,
                $resolvePanelId($line['panel_id'] ?? null),
                $line['pricing_item_id'] ?? null,
                $line['item_code']       ?? '',
                $line['description']     ?? '',
                $line['category']        ?? 'misc',
                $line['supplier']        ?? null,
                $line['unit']            ?? 'ea',
                (float)($line['qty']         ?? 1),
                (float)($line['cost_price']  ?? 0),
                (float)($line['markup_pct']  ?? 30),
                $line['notes']           ?? null,
                (int)($line['price_overridden'] ?? 0),
                $i,
            ]);
        }

        // 5. Labour — replace all lines
        $db->prepare('DELETE FROM quote_labour WHERE quote_id = ?')->execute([$id]);
        $labStmt = $db->prepare('
            INSERT INTO quote_labour (quote_id, panel_id, category, skill_level, hours, rate, sort_order)
            VALUES (?,?,?,?,?,?,?)
        ');
        foreach (($b['labour'] ?? []) as $i => $line) {
            $labStmt->execute([
                $id,
                $resolvePanelId($line['panel_id'] ?? null),
                $line['category']    ?? '',
                $line['skill_level'] ?? 'Skilled',
                (float)($line['hours'] ?? 0),
                (float)($line['rate']  ?? 0),
                $i,
            ]);
        }

        // 6. Copper — replace all runs
        $db->prepare('DELETE FROM quote_copper WHERE quote_id = ?')->execute([$id]);
        $cuStmt = $db->prepare('
            INSERT INTO quote_copper (quote_id, panel_id, name, width_mm, height_mm, length_m, qty, price_per_m, waste_pct, fab_hours, fab_rate, tinned, markup_pct, sort_order)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ');
        foreach (($b['copper'] ?? []) as $i => $run) {
            $cuStmt->execute([
                $id,
                $resolvePanelId($run['panel_id'] ?? null),
                $run['name']        ?? 'Busbar run',
                (float)($run['width_mm']    ?? 40),
                (float)($run['height_mm']   ?? 10),
                (float)($run['length_m']    ?? 1),
                (int)($run['qty']           ?? 1),
                (float)($run['price_per_m'] ?? 358),
                (float)($run['waste_pct']   ?? 12),
                (float)($run['fab_hours']   ?? 0),
                (float)($run['fab_rate']    ?? 520),
                (int)($run['tinned']        ?? 1),
                (float)($run['markup_pct']  ?? 35),
                $i,
            ]);
        }

        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        throw $e;
    }

    json_ok(fetch_quote($id));
}

if ($method === 'POST' && $id && $action === 'set_status') {
    $b      = body();
    $status = $b['status'] ?? '';
    if (!in_array($status, ['draft','sent','won','lost'])) json_error('Invalid status.');
    db()->prepare('UPDATE quotes SET status = ? WHERE id = ?')->execute([$status, $id]);
    json_ok();
}

if ($method === 'DELETE' && $id) {
    db()->prepare('DELETE FROM quotes WHERE id = ?')->execute([$id]);
    json_ok();
}

json_error('Not found.', 404);
