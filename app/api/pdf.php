<?php
// PDF generation endpoint — requires DomPDF
// Install: cd app/ && composer install
// Usage:   GET api/pdf.php?id=N

require_once __DIR__ . '/base.php';

$user = require_auth();

$id = isset($_GET['id']) ? (int)$_GET['id'] : null;
if (!$id) json_error('Quote ID required.');

// ── Fetch quote ───────────────────────────────────────────────────────────────

$db = db();

$q = $db->prepare('
    SELECT q.*,
           c.name            AS customer_name,
           c.contact_person,
           c.phone,
           c.email,
           c.address,
           u.full_name       AS estimator_name
    FROM quotes q
    LEFT JOIN customers c ON c.id = q.customer_id
    LEFT JOIN users     u ON u.id = q.estimator_id
    WHERE q.id = ?
');
$q->execute([$id]);
$quote = $q->fetch(PDO::FETCH_ASSOC);
if (!$quote) json_error('Quote not found.', 404);

$bom = $db->prepare('SELECT * FROM quote_bom    WHERE quote_id = ? ORDER BY sort_order, id');
$bom->execute([$id]);
$quote['bom'] = $bom->fetchAll(PDO::FETCH_ASSOC);

$lab = $db->prepare('SELECT * FROM quote_labour WHERE quote_id = ? ORDER BY sort_order, id');
$lab->execute([$id]);
$quote['labour'] = $lab->fetchAll(PDO::FETCH_ASSOC);

$pan = $db->prepare('SELECT id, name, description, qty FROM quote_panels WHERE quote_id = ? ORDER BY sort_order, id');
$pan->execute([$id]);
$quote['panels'] = $pan->fetchAll(PDO::FETCH_ASSOC);

$cu = $db->prepare('SELECT * FROM quote_copper  WHERE quote_id = ? ORDER BY sort_order, id');
$cu->execute([$id]);
$quote['copper'] = $cu->fetchAll(PDO::FETCH_ASSOC);

// ── Fetch company settings ────────────────────────────────────────────────────

$settingsRaw = $db->query("SELECT `key`, `value` FROM settings")->fetchAll(PDO::FETCH_KEY_PAIR);
$s = $settingsRaw;

// ── Compute totals ────────────────────────────────────────────────────────────

$vatRate = (float)($quote['vat_rate'] ?? 15);

$bomSell = 0;
foreach ($quote['bom'] as $item) {
    $bomSell += (float)$item['qty'] * (float)$item['cost_price'] * (1 + (float)$item['markup_pct'] / 100);
}

$labourSell = 0;
foreach ($quote['labour'] as $row) {
    if ((float)$row['hours'] > 0) {
        $labourSell += (float)$row['hours'] * (float)$row['rate'];
    }
}

$copperSell = 0;
foreach ($quote['copper'] as $run) {
    $mat = (float)$run['qty'] * (float)$run['length_m'] * (float)$run['price_per_m'] * (1 + (float)$run['waste_pct'] / 100);
    $fab = (float)$run['fab_hours'] * (float)$run['fab_rate'];
    $copperSell += ($mat + $fab) * (1 + (float)$run['markup_pct'] / 100);
}

$subtotal = $bomSell + $labourSell + $copperSell;
$vatAmt   = $subtotal * $vatRate / 100;
$total    = $subtotal + $vatAmt;

// ── Build HTML ────────────────────────────────────────────────────────────────

function fmt(float $n, int $dec = 2): string {
    return 'R ' . number_format($n, $dec, '.', ' ');
}

function esc(mixed $v): string {
    return htmlspecialchars((string)($v ?? ''), ENT_QUOTES, 'UTF-8');
}

$fmt     = $quote['pdf_format'] ?? 'grouped';
$coName  = $s['company_name']    ?? 'Power Panels & Electrical (Pty) Ltd';
$coSub   = $s['company_sub']     ?? 'Distribution Boards · MCCs · Control Panels';
$coAddr  = $s['company_address'] ?? '';
$coPhone = $s['company_phone']   ?? '';
$coEmail = $s['company_email']   ?? '';
$coReg   = $s['company_reg']     ?? '';
$coVat   = $s['company_vat']     ?? '';
$coCert  = $s['company_cert']    ?? '';

$catLabels = [
    'enclosure'  => 'Enclosures',
    'protection' => 'Circuit Protection',
    'copper'     => 'Copper Work',
    'internal'   => 'Internal Components',
    'wiring'     => 'Wiring',
    'automation' => 'Automation',
    'metering'   => 'Metering',
    'misc'       => 'Miscellaneous',
];

// Build BOM rows HTML (skipped for per_panel)
$bomHtml = '';
if ($fmt !== 'per_panel' && !empty($quote['bom'])) {
    if ($fmt === 'itemised' || $fmt === 'summary') {
        // Group by category for both grouped and summary
        $groups = [];
        foreach ($quote['bom'] as $item) {
            $groups[$item['category'] ?? 'misc'][] = $item;
        }
        if ($fmt === 'itemised') {
            foreach ($groups as $cat => $items) {
                $catLabel = $catLabels[$cat] ?? ucfirst($cat);
                $bomHtml .= '<tr style="background:#F1F5F9"><td colspan="6" style="padding:5px 6px;font-weight:600;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid #CBD5E1">' . esc($catLabel) . '</td></tr>';
                foreach ($items as $item) {
                    $sell  = (float)$item['cost_price'] * (1 + (float)$item['markup_pct'] / 100);
                    $line  = (float)$item['qty'] * $sell;
                    $bomHtml .= '<tr>';
                    $bomHtml .= '<td style="font-family:monospace;font-size:9px;color:#64748B">' . esc($item['item_code']) . '</td>';
                    $bomHtml .= '<td>' . esc($item['description']) . '</td>';
                    $bomHtml .= '<td style="color:#64748B">' . esc($item['unit']) . '</td>';
                    $bomHtml .= '<td style="text-align:right;font-family:monospace">' . esc($item['qty']) . '</td>';
                    $bomHtml .= '<td style="text-align:right;font-family:monospace">' . fmt($sell) . '</td>';
                    $bomHtml .= '<td style="text-align:right;font-family:monospace;font-weight:500">' . fmt($line) . '</td>';
                    $bomHtml .= '</tr>';
                }
            }
        } elseif ($fmt === 'summary') {
            foreach ($groups as $cat => $items) {
                $catTotal = array_reduce($items, fn($s,$i) => $s + (float)$i['qty']*(float)$i['cost_price']*(1+(float)$i['markup_pct']/100), 0);
                $catLabel = $catLabels[$cat] ?? ucfirst($cat);
                $bomHtml .= '<tr>';
                $bomHtml .= '<td colspan="5">' . esc($catLabel) . '</td>';
                $bomHtml .= '<td style="text-align:right;font-family:monospace;font-weight:500">' . fmt($catTotal) . '</td>';
                $bomHtml .= '</tr>';
            }
        }
    } else {
        // grouped — show all items without group headers (simpler for DomPDF)
        foreach ($quote['bom'] as $item) {
            $sell  = (float)$item['cost_price'] * (1 + (float)$item['markup_pct'] / 100);
            $line  = (float)$item['qty'] * $sell;
            $bomHtml .= '<tr>';
            $bomHtml .= '<td style="font-family:monospace;font-size:9px;color:#64748B">' . esc($item['item_code']) . '</td>';
            $bomHtml .= '<td>' . esc($item['description']) . '</td>';
            $bomHtml .= '<td style="color:#64748B">' . esc($item['unit']) . '</td>';
            $bomHtml .= '<td style="text-align:right;font-family:monospace">' . esc($item['qty']) . '</td>';
            $bomHtml .= '<td style="text-align:right;font-family:monospace">' . fmt($sell) . '</td>';
            $bomHtml .= '<td style="text-align:right;font-family:monospace;font-weight:500">' . fmt($line) . '</td>';
            $bomHtml .= '</tr>';
        }
    }
}

$labourRows = array_filter($quote['labour'], fn($r) => (float)$r['hours'] > 0);

ob_start();
?>
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 10.5px; color: #0F172A; line-height: 1.45; }
  table { width: 100%; border-collapse: collapse; }
  .mono { font-family: DejaVu Sans Mono, monospace; }

  /* Header */
  .hd { display:table; width:100%; border-bottom: 2px solid #0F172A; padding-bottom: 16px; margin-bottom: 20px; }
  .hd-left  { display:table-cell; vertical-align:top; }
  .hd-right { display:table-cell; vertical-align:top; text-align:right; }
  .brand-mark { display:inline-block; background:#1D4ED8; color:white; font-weight:700; font-size:16px; padding: 6px 10px; border-radius:4px; font-family:monospace; }
  .brand-name { font-size:14px; font-weight:600; margin-top:4px; }
  .brand-sub  { font-size:9px; color:#64748B; font-family:monospace; text-transform:uppercase; letter-spacing:0.08em; }
  .doc-type   { font-size:9.5px; color:#64748B; font-family:monospace; text-transform:uppercase; letter-spacing:0.18em; }
  .doc-num    { font-size:20px; font-weight:600; font-family:monospace; margin-top:2px; }
  .doc-meta   { font-size:9.5px; color:#64748B; font-family:monospace; margin-top:3px; }

  /* Info grid */
  .info { display:table; width:100%; margin-bottom:20px; border-bottom:1px solid #E2E8F0; padding-bottom:16px; }
  .info-col { display:table-cell; width:25%; vertical-align:top; padding-right:12px; }
  .info-k   { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.12em; color:#64748B; margin-bottom:3px; margin-top:10px; }
  .info-k:first-child { margin-top:0; }
  .info-v   { font-size:10.5px; }
  .info-v.bold { font-weight:600; }

  /* Section title */
  .sec-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.14em; color:#0F172A; margin: 20px 0 8px; border-left: 3px solid #1D4ED8; padding-left: 8px; }

  /* Data table */
  .dt thead th { text-align:left; font-size:8.5px; font-weight:600; text-transform:uppercase; letter-spacing:0.1em; color:#475569; padding:6px 6px; border-bottom:1.5px solid #0F172A; }
  .dt tbody td { padding:7px 6px; border-bottom:1px solid #E2E8F0; font-size:10.5px; vertical-align:top; }
  .dt tbody tr.group td { background:#F1F5F9; font-weight:600; font-size:9px; text-transform:uppercase; letter-spacing:0.1em; padding:5px 6px; border-bottom:1px solid #CBD5E1; }
  .t-right { text-align:right; }

  /* Totals */
  .totals-wrap { text-align:right; margin-top:16px; }
  .totals-inner { display:inline-block; width:300px; font-size:10.5px; font-family:monospace; }
  .tot-row { display:table; width:100%; padding:3px 0; }
  .tot-k, .tot-v { display:table-cell; }
  .tot-v { text-align:right; }
  .tot-row.grand { border-top:2px solid #0F172A; margin-top:6px; padding-top:7px; font-weight:700; font-size:13px; }

  /* Footer text */
  .foot-grid { display:table; width:100%; margin-top:18px; padding-top:14px; border-top:1px solid #E2E8F0; font-size:9.5px; color:#64748B; }
  .foot-col  { display:table-cell; width:50%; vertical-align:top; padding-right:20px; }
  .foot-title { font-weight:700; font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:#0F172A; margin-bottom:5px; }

  .terms-block { margin-top:14px; padding-top:12px; border-top:1px solid #E2E8F0; font-size:9.5px; color:#64748B; }

  /* Signatures */
  .sign { display:table; width:100%; margin-top:28px; }
  .sign-col { display:table-cell; width:50%; padding-right:32px; vertical-align:top; }
  .sign-line { border-top:1px solid #0F172A; margin-top:36px; padding-top:4px; font-size:9px; color:#64748B; font-family:monospace; text-transform:uppercase; letter-spacing:0.08em; }

  /* Page footer */
  .pg-foot { border-top:1px solid #E2E8F0; margin-top:24px; padding-top:8px; display:table; width:100%; font-size:8.5px; color:#94A3B8; font-family:monospace; }
  .pg-foot-l { display:table-cell; }
  .pg-foot-r { display:table-cell; text-align:right; }
</style>
</head>
<body>

<!-- Header -->
<div class="hd">
  <div class="hd-left">
    <?php
    $logoExt  = $s['company_logo'] ?? '';
    $logoPath = __DIR__ . '/../assets/logo.' . $logoExt;
    if ($logoExt && file_exists($logoPath)):
        $logoMime = $logoExt === 'svg' ? 'image/svg+xml' : 'image/' . $logoExt;
        $logoSrc  = 'data:' . $logoMime . ';base64,' . base64_encode(file_get_contents($logoPath));
    ?>
    <img src="<?= $logoSrc ?>" alt="<?= esc($coName) ?>" style="height:44px;max-width:180px;object-fit:contain;display:block;margin-bottom:4px;"/>
    <?php else: ?>
    <span class="brand-mark">PP</span>
    <?php endif ?>
    <div class="brand-name"><?= esc($coName) ?></div>
    <div class="brand-sub"><?= esc($coSub) ?></div>
  </div>
  <div class="hd-right">
    <div class="doc-type">Quotation</div>
    <div class="doc-num"><?= esc($quote['quote_number']) ?></div>
    <div class="doc-meta"><?= esc($quote['quote_date'] ?? '') ?></div>
    <div class="doc-meta">Valid <?= (int)($quote['validity_days'] ?? 30) ?> days</div>
  </div>
</div>

<!-- Info grid -->
<div class="info">
  <div class="info-col">
    <div class="info-k">Bill To</div>
    <div class="info-v bold"><?= esc($quote['customer_name'] ?? '—') ?></div>
    <?php if ($quote['contact_person']): ?><div class="info-v"><?= esc($quote['contact_person']) ?></div><?php endif ?>
    <?php if ($quote['phone'])         : ?><div class="info-v"><?= esc($quote['phone']) ?></div><?php endif ?>
    <?php if ($quote['email'])         : ?><div class="info-v"><?= esc($quote['email']) ?></div><?php endif ?>
    <?php if ($quote['address'])       : ?><div class="info-v" style="color:#64748B"><?= esc($quote['address']) ?></div><?php endif ?>
  </div>
  <div class="info-col">
    <div class="info-k">Project</div>
    <div class="info-v bold"><?= esc($quote['project_name'] ?? '—') ?></div>
    <?php if ($quote['site_location']): ?><div class="info-v" style="color:#64748B"><?= esc($quote['site_location']) ?></div><?php endif ?>
    <div class="info-k">Prepared by</div>
    <div class="info-v"><?= esc($quote['estimator_name'] ?? '—') ?></div>
  </div>
  <div class="info-col">
    <div class="info-k">From</div>
    <div class="info-v bold"><?= esc($coName) ?></div>
    <?php if ($coAddr) : ?><div class="info-v" style="color:#64748B"><?= esc($coAddr) ?></div><?php endif ?>
    <?php if ($coPhone): ?><div class="info-v"><?= esc($coPhone) ?></div><?php endif ?>
    <?php if ($coEmail): ?><div class="info-v"><?= esc($coEmail) ?></div><?php endif ?>
  </div>
  <div class="info-col">
    <?php if ($coReg) : ?><div class="info-k">Reg No.</div><div class="info-v"><?= esc($coReg) ?></div><?php endif ?>
    <?php if ($coVat) : ?><div class="info-k">VAT No.</div><div class="info-v"><?= esc($coVat) ?></div><?php endif ?>
    <?php if ($coCert): ?><div class="info-k">Certification</div><div class="info-v" style="color:#64748B"><?= esc($coCert) ?></div><?php endif ?>
  </div>
</div>

<!-- Per-panel scope of supply -->
<?php if ($fmt === 'per_panel'):
    $panels     = $quote['panels'] ?? [];
    $assignedIds = array_map(fn($p) => (string)$p['id'], $panels);

    $bsell = fn($items) => array_reduce($items, fn($s,$i) => $s + (float)$i['qty']*(float)$i['cost_price']*(1+(float)$i['markup_pct']/100), 0);
    $lsell = fn($rows)  => array_reduce($rows,  fn($s,$r) => $s + (float)$r['hours']*(float)$r['rate'], 0);
    $csell = function($runs) {
        $t = 0;
        foreach ($runs as $r) {
            $mat = (float)$r['qty']*(float)$r['length_m']*(float)$r['price_per_m']*(1+(float)$r['waste_pct']/100);
            $fab = (float)$r['fab_hours']*(float)$r['fab_rate'];
            $t  += ($mat + $fab) * (1 + (float)$r['markup_pct']/100);
        }
        return $t;
    };

    $generalBom    = array_filter($quote['bom'],    fn($i) => !$i['panel_id'] || !in_array((string)$i['panel_id'], $assignedIds));
    $generalLabour = array_filter($labourRows,       fn($r) => !$r['panel_id'] || !in_array((string)$r['panel_id'], $assignedIds));
    $generalCopper = array_filter($quote['copper'],  fn($r) => !$r['panel_id'] || !in_array((string)$r['panel_id'], $assignedIds));
    $generalTotal  = $bsell($generalBom) + $lsell($generalLabour) + $csell($generalCopper);
?>
<div class="sec-title">Scope of Supply</div>
<table class="dt">
  <thead>
    <tr>
      <th>Panel / Description</th>
      <th class="t-right" style="width:44px">Qty</th>
      <th class="t-right" style="width:126px">Unit Price</th>
      <th class="t-right" style="width:126px">Total (excl. VAT)</th>
    </tr>
  </thead>
  <tbody>
    <?php foreach ($panels as $panel):
        $pid       = (string)$panel['id'];
        $panelBom  = array_filter($quote['bom'],   fn($i) => (string)$i['panel_id'] === $pid);
        $panelLab  = array_filter($labourRows,      fn($r) => (string)$r['panel_id'] === $pid);
        $panelCu   = array_filter($quote['copper'], fn($r) => (string)$r['panel_id'] === $pid);
        $total     = $bsell($panelBom) + $lsell($panelLab) + $csell($panelCu);
        $qty       = max(1, (int)($panel['qty'] ?? 1));
        $unitPrice = $total / $qty;
    ?>
    <tr>
      <td>
        <div style="font-weight:600"><?= esc($panel['name']) ?></div>
        <?php if ($panel['description']): ?>
        <div style="font-size:9.5px;color:#64748B;margin-top:2px"><?= esc($panel['description']) ?></div>
        <?php endif ?>
      </td>
      <td class="t-right mono"><?= $qty ?></td>
      <td class="t-right mono"><?= fmt($unitPrice) ?></td>
      <td class="t-right mono" style="font-weight:500"><?= fmt($total) ?></td>
    </tr>
    <?php endforeach ?>
    <?php if ($generalTotal > 0): ?>
    <tr>
      <td><div style="font-weight:600">General / Common</div></td>
      <td class="t-right mono">1</td>
      <td class="t-right mono"><?= fmt($generalTotal) ?></td>
      <td class="t-right mono" style="font-weight:500"><?= fmt($generalTotal) ?></td>
    </tr>
    <?php endif ?>
  </tbody>
</table>
<?php endif ?>

<!-- BOM -->
<?php if ($fmt !== 'per_panel' && !empty($quote['bom'])): ?>
<div class="sec-title">Bill of Materials</div>
<table class="dt">
  <thead>
    <tr>
      <th style="width:110px">Item Code</th>
      <th>Description</th>
      <th style="width:44px">Unit</th>
      <th class="t-right" style="width:44px">Qty</th>
      <th class="t-right" style="width:86px">Unit Price</th>
      <th class="t-right" style="width:96px">Total</th>
    </tr>
  </thead>
  <tbody>
    <?= $bomHtml ?>
    <tr>
      <td colspan="5" style="text-align:right;font-weight:600;border-top:1px solid #94A3B8;padding-top:8px">Materials Subtotal</td>
      <td style="text-align:right;font-family:monospace;font-weight:600;border-top:1px solid #94A3B8;padding-top:8px"><?= fmt($bomSell) ?></td>
    </tr>
  </tbody>
</table>
<?php endif ?>

<!-- Labour -->
<?php if ($fmt !== 'per_panel' && !empty($labourRows)): ?>
<div class="sec-title">Labour</div>
<table class="dt">
  <thead>
    <tr>
      <th>Category</th>
      <th style="width:110px">Skill Level</th>
      <th class="t-right" style="width:70px">Hours</th>
      <th class="t-right" style="width:96px">Rate (R/hr)</th>
      <th class="t-right" style="width:106px">Total</th>
    </tr>
  </thead>
  <tbody>
    <?php foreach ($labourRows as $row): ?>
    <tr>
      <td><?= esc($row['category']) ?></td>
      <td style="color:#64748B;text-transform:capitalize"><?= esc($row['skill_level']) ?></td>
      <td class="t-right mono"><?= number_format((float)$row['hours'], 1) ?></td>
      <td class="t-right mono"><?= fmt((float)$row['rate'], 0) ?></td>
      <td class="t-right mono" style="font-weight:500"><?= fmt((float)$row['hours'] * (float)$row['rate']) ?></td>
    </tr>
    <?php endforeach ?>
    <tr>
      <td colspan="4" style="text-align:right;font-weight:600;border-top:1px solid #94A3B8;padding-top:8px">Labour Subtotal</td>
      <td class="t-right mono" style="font-weight:600;border-top:1px solid #94A3B8;padding-top:8px"><?= fmt($labourSell) ?></td>
    </tr>
  </tbody>
</table>
<?php endif ?>

<!-- Copper -->
<?php if ($fmt !== 'per_panel' && !empty($quote['copper'])): ?>
<div class="sec-title">Copper Fabrication</div>
<table class="dt">
  <thead>
    <tr>
      <th>Description</th>
      <th style="width:90px">Size (mm)</th>
      <th class="t-right" style="width:64px">Length</th>
      <th class="t-right" style="width:44px">Qty</th>
      <th class="t-right" style="width:106px">Total</th>
    </tr>
  </thead>
  <tbody>
    <?php foreach ($quote['copper'] as $run):
        $mat  = (float)$run['qty'] * (float)$run['length_m'] * (float)$run['price_per_m'] * (1 + (float)$run['waste_pct'] / 100);
        $fab  = (float)$run['fab_hours'] * (float)$run['fab_rate'];
        $sell = ($mat + $fab) * (1 + (float)$run['markup_pct'] / 100);
    ?>
    <tr>
      <td><?= esc($run['name']) ?><?= $run['tinned'] ? ' <span style="font-size:9px;color:#64748B">(tinned)</span>' : '' ?></td>
      <td class="mono" style="color:#64748B"><?= esc($run['width_mm']) ?>×<?= esc($run['height_mm']) ?></td>
      <td class="t-right mono"><?= number_format((float)$run['length_m'], 1) ?> m</td>
      <td class="t-right mono"><?= (int)$run['qty'] ?></td>
      <td class="t-right mono" style="font-weight:500"><?= fmt($sell) ?></td>
    </tr>
    <?php endforeach ?>
  </tbody>
</table>
<?php endif ?>

<!-- Totals -->
<div class="totals-wrap">
  <div class="totals-inner">
    <?php if ($fmt !== 'per_panel' && $bomSell > 0): ?>
    <div class="tot-row"><span class="tot-k">Materials</span><span class="tot-v"><?= fmt($bomSell) ?></span></div>
    <?php endif ?>
    <?php if ($fmt !== 'per_panel' && $labourSell > 0): ?>
    <div class="tot-row"><span class="tot-k">Labour</span><span class="tot-v"><?= fmt($labourSell) ?></span></div>
    <?php endif ?>
    <?php if ($fmt !== 'per_panel' && $copperSell > 0): ?>
    <div class="tot-row"><span class="tot-k">Copper Fabrication</span><span class="tot-v"><?= fmt($copperSell) ?></span></div>
    <?php endif ?>
    <div class="tot-row"><span class="tot-k">Subtotal</span><span class="tot-v"><?= fmt($subtotal) ?></span></div>
    <div class="tot-row"><span class="tot-k">VAT (<?= number_format($vatRate, 0) ?>%)</span><span class="tot-v"><?= fmt($vatAmt) ?></span></div>
    <div class="tot-row grand"><span class="tot-k">TOTAL</span><span class="tot-v"><?= fmt($total) ?></span></div>
  </div>
</div>

<!-- Notes & Exclusions -->
<?php if ($quote['notes'] || $quote['exclusions']): ?>
<div class="foot-grid">
  <?php if ($quote['notes']): ?>
  <div class="foot-col">
    <div class="foot-title">Notes</div>
    <div><?= nl2br(esc($quote['notes'])) ?></div>
  </div>
  <?php endif ?>
  <?php if ($quote['exclusions']): ?>
  <div class="foot-col">
    <div class="foot-title">Exclusions</div>
    <div><?= nl2br(esc($quote['exclusions'])) ?></div>
  </div>
  <?php endif ?>
</div>
<?php endif ?>

<?php if ($quote['terms']): ?>
<div class="terms-block">
  <div class="foot-title">Terms &amp; Conditions</div>
  <div><?= nl2br(esc($quote['terms'])) ?></div>
</div>
<?php endif ?>

<!-- Signatures -->
<div class="sign">
  <div class="sign-col">
    <div class="sign-line">Authorised — <?= esc($coName) ?></div>
  </div>
  <div class="sign-col">
    <div class="sign-line">Accepted — <?= esc($quote['customer_name'] ?? 'Customer') ?></div>
  </div>
</div>

<!-- Page footer -->
<div class="pg-foot">
  <div class="pg-foot-l"><?= esc($coName) ?><?= $coReg ? ' · Reg ' . esc($coReg) : '' ?><?= $coVat ? ' · VAT ' . esc($coVat) : '' ?></div>
  <div class="pg-foot-r"><?= esc($quote['quote_number']) ?></div>
</div>

</body>
</html>
<?php
$html = ob_get_clean();

// ── Render PDF ────────────────────────────────────────────────────────────────

$vendorPath = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($vendorPath)) {
    // DomPDF not installed — stream HTML as fallback with print dialog
    header('Content-Type: text/html; charset=utf-8');
    echo $html;
    exit;
}

require_once $vendorPath;

use Dompdf\Dompdf;
use Dompdf\Options;

$options = new Options();
$options->set('isHtml5ParserEnabled', true);
$options->set('isRemoteEnabled', false);
$options->set('defaultFont', 'DejaVu Sans');

$dompdf = new Dompdf($options);
$dompdf->loadHtml($html, 'UTF-8');
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();

$filename = preg_replace('/[^A-Za-z0-9\-]/', '_', $quote['quote_number']) . '.pdf';

header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Cache-Control: private, max-age=0, must-revalidate');

echo $dompdf->output();
