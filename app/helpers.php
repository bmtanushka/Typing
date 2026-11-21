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

/**
 * Versioned URL for a file in public_html/assets.
 *
 * Under Apache/LiteSpeed the version goes in the PATH (/assets/_v<hash>/js/app.js, rewritten
 * by .htaccess) so that ES modules imported relatively by a versioned file inherit the same
 * version – a query string would not propagate to imports. PHP's built-in dev server cannot
 * rewrite, so it gets ?v=<hash> instead (no long-lived caching there).
 */
function asset(string $path): string
{
    $path = ltrim($path, '/');
    if (PHP_SAPI === 'cli-server') {
        return base_path() . '/assets/' . $path . '?v=' . asset_version();
    }
    return base_path() . '/assets/_v' . asset_version() . '/' . $path;
}

/**
 * All static ES-module dependencies of the given entry modules (paths under assets/), so the
 * layout can emit <link rel="modulepreload"> and the browser fetches them in parallel instead
 * of discovering them one import at a time. Dynamic import() calls are not followed (they are
 * meant to stay lazy). Cached per asset version.
 */
function module_graph(array $entries): array
{
    $key = asset_version() . ':' . implode(',', $entries);
    static $memo = [];
    if (isset($memo[$key])) {
        return $memo[$key];
    }
    $cacheFile = KQ_ROOT . '/storage/cache/modules-' . md5($key) . '.json';
    if (is_file($cacheFile)) {
        $cached = json_decode((string) file_get_contents($cacheFile), true);
        if (is_array($cached)) {
            return $memo[$key] = $cached;
        }
    }
    $root = realpath(KQ_PUBLIC . '/assets');
    $seen = [];
    $walk = static function (string $rel) use (&$walk, &$seen, $root): void {
        $file = realpath($root . '/' . $rel);
        if ($file === false || !str_starts_with($file, $root) || isset($seen[$rel])) {
            return;
        }
        $seen[$rel] = true;
        $src = (string) file_get_contents($file);
        preg_match_all('/(?:^|[\s;}])(?:import|export)\s[^\'"]*?\sfrom\s*[\'"](\.{1,2}\/[^\'"]+)[\'"]|^import\s*[\'"](\.{1,2}\/[^\'"]+)[\'"]/m', $src, $m, PREG_SET_ORDER);
        foreach ($m as $match) {
            $spec = $match[1] !== '' ? $match[1] : ($match[2] ?? '');
            $target = realpath(dirname($file) . '/' . $spec);
            if ($target !== false && str_starts_with($target, $root)) {
                $walk(ltrim(substr($target, strlen($root)), '/'));
            }
        }
    };
    foreach ($entries as $entry) {
        $walk(ltrim($entry, '/'));
    }
    $list = array_values(array_diff(array_keys($seen), $entries));
    if (is_dir(dirname($cacheFile)) || @mkdir(dirname($cacheFile), 0750, true)) {
        @file_put_contents($cacheFile, json_encode($list));
    }
    return $memo[$key] = $list;
}

/** Short hash that changes whenever any file under public_html/assets changes. */
function asset_version(): string
{
    static $version = null;
    if ($version !== null) {
        return $version;
    }
    $configured = Config::get('app.asset_version');
    if (is_string($configured) && preg_match('/^[a-f0-9]{4,32}$/', $configured)) {
        return $version = $configured;
    }
    $parts = [];
    $dir = KQ_PUBLIC . '/assets';
    if (is_dir($dir)) {
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS));
        foreach ($it as $file) {
            $parts[] = $file->getPathname() . ':' . $file->getMTime() . ':' . $file->getSize();
        }
    }
    sort($parts);
    return $version = substr(md5(implode('|', $parts)), 0, 10);
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
    if (Config::get('security.force_https')) {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }
}
