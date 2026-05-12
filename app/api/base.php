<?php
// Base helper included by every API endpoint.
// Handles CORS, JSON responses, session bootstrapping, and auth guards.

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

// ── CORS ──────────────────────────────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Allow same-origin requests (same domain subfolder)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host   = $_SERVER['HTTP_HOST'] ?? '';
if (str_contains($origin, $host)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Error handling ────────────────────────────────────────────────────────────
if (APP_ENV === 'development') {
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    error_reporting(0);
}

set_exception_handler(function (Throwable $e) {
    $msg = APP_ENV === 'development' ? $e->getMessage() : 'An error occurred.';
    json_error($msg, 500);
});

// ── Session ───────────────────────────────────────────────────────────────────
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Strict');
session_name(SESSION_NAME);
session_set_cookie_params(['lifetime' => SESSION_LIFETIME, 'path' => '/']);
session_start();

// ── Helpers ───────────────────────────────────────────────────────────────────
function json_ok(mixed $data = null, int $code = 200): never {
    http_response_code($code);
    echo json_encode(['ok' => true, 'data' => $data], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(string $message, int $code = 400): never {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function body(): array {
    static $body = null;
    if ($body === null) {
        // Try php://input first (JSON requests from fetch API)
        $raw = @file_get_contents('php://input');
        if ($raw && ($decoded = json_decode($raw, true)) !== null) {
            $body = $decoded;
        // Fall back to $_POST (form-encoded or when php://input is unavailable)
        } elseif (!empty($_POST)) {
            // Decode any JSON-encoded fields (used for nested arrays like BOM)
            $body = [];
            foreach ($_POST as $k => $v) {
                $decoded = json_decode($v, true);
                $body[$k] = ($decoded !== null) ? $decoded : $v;
            }
        } else {
            $body = [];
        }
    }
    return $body;
}

function method(): string {
    // Allow PUT override via POST + ?_method=PUT (needed because PHP only
    // populates $_POST for POST requests, not for native PUT requests)
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_GET['_method'] ?? '') === 'PUT') {
        return 'PUT';
    }
    return $_SERVER['REQUEST_METHOD'];
}

// Require a logged-in session; returns the current user array.
function require_auth(): array {
    if (empty($_SESSION['user'])) {
        json_error('Unauthorised.', 401);
    }
    return $_SESSION['user'];
}

// Require admin role.
function require_admin(): array {
    $user = require_auth();
    if ($user['role'] !== 'admin') {
        json_error('Forbidden.', 403);
    }
    return $user;
}
