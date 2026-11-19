<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Hardened PHP session. Started lazily: guests who never sign in get no cookie.
 */
final class Session
{
    public const NAME = 'kq_session';

    public static function isHttps(): bool
    {
        if (Config::get('security.force_https')) {
            return true;
        }
        if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
            return true;
        }
        return Config::get('security.trust_proxy') && strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
    }

    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        if (PHP_SAPI === 'cli') {
            $_SESSION = $_SESSION ?? [];
            return;
        }
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.cookie_httponly', '1');
        ini_set('session.gc_maxlifetime', (string) (60 * 60 * 24 * 30));
        $dir = KQ_ROOT . '/storage/sessions';
        if (is_dir($dir) || @mkdir($dir, 0700, true)) {
            session_save_path($dir);
        }
        session_name(self::NAME);
        session_set_cookie_params([
            'lifetime' => 60 * 60 * 24 * 30,
            'path' => (base_path() ?: '') . '/',
            'secure' => self::isHttps(),
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }

    /** Start only if the browser already has a session cookie (keeps guests cookie-free). */
    public static function resume(): bool
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return true;
        }
        if (!isset($_COOKIE[self::NAME]) || !preg_match('/^[A-Za-z0-9,-]{20,128}$/', (string) $_COOKIE[self::NAME])) {
            return false;
        }
        self::start();
        return true;
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return $_SESSION[$key] ?? $default;
    }

    public static function set(string $key, mixed $value): void
    {
        $_SESSION[$key] = $value;
    }

    /** New session id after login/registration (prevents session fixation). */
    public static function regenerate(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
        }
    }

    public static function destroy(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            return;
        }
        $_SESSION = [];
        $p = session_get_cookie_params();
        setcookie(self::NAME, '', [
            'expires' => time() - 3600, 'path' => $p['path'], 'secure' => $p['secure'],
            'httponly' => true, 'samesite' => 'Lax',
        ]);
        session_destroy();
    }
}
