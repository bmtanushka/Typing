<?php
/**
 * Global helper functions (kept deliberately small).
 */
declare(strict_types=1);

use App\Core\Config;

/** Escape for HTML text and attribute contexts. */
function e(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8');
}

function config(string $key, mixed $default = null): mixed
{
    return Config::get($key, $default);
}

/**
 * Base path of the app ('' at domain root, '/sub' in a subfolder).
 * Uses config app.base_path if set, otherwise derives it from SCRIPT_NAME.
 */
function base_path(): string
{
    static $base = null;
    if ($base !== null) {
        return $base;
    }
    $configured = Config::get('app.base_path');
    if (is_string($configured)) {
        return $base = rtrim($configured, '/');
    }
    $dir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/index.php'));
    return $base = ($dir === '/' || $dir === '.') ? '' : rtrim($dir, '/');
}

/** Build an app URL from a path ("/lessons" -> "/sub/lessons"). */
function url(string $path = '/'): string
{
    $path = '/' . ltrim($path, '/');
    return base_path() . ($path === '/' ? '/' : $path);
}

/** Versioned URL for a file in public_html/assets (cache-busting by mtime). */
function asset(string $path): string
{
    $path = ltrim($path, '/');
    $file = KQ_PUBLIC . '/assets/' . $path;
    $v = is_file($file) ? (string) filemtime($file) : '0';
    return base_path() . '/assets/' . $path . '?v=' . $v;
}

/** Current request path relative to the base path. */
function current_path(): string
{
    return \App\Core\Request::normalisePath($_SERVER['REQUEST_URI'] ?? '/', base_path());
}

/** Is the given nav path the active section? */
function is_active(string $path): bool
{
    $current = current_path();
    return $path === '/' ? $current === '/' : ($current === $path || str_starts_with($current, $path . '/'));
}

/** Primary navigation items. */
function nav_items(): array
{
    return [
        ['path' => '/lessons',  'label' => 'Lessons'],
        ['path' => '/practice', 'label' => 'Practice'],
        ['path' => '/test',     'label' => 'Typing test'],
        ['path' => '/games',    'label' => 'Games'],
        ['path' => '/progress', 'label' => 'Progress'],
    ];
}

/** Security headers (duplicated in .htaccess so static files get them too). */
function send_security_headers(): void
{
    if (headers_sent()) {
        return;
    }
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    header('Cross-Origin-Opener-Policy: same-origin');
    header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; "
        . "font-src 'self'; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; "
        . "form-action 'self'; frame-ancestors 'none'");
    header_remove('X-Powered-By');
}
