<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Config;
use App\Core\Database;
use App\Core\Request;
use App\Core\Session;
use App\Models\UserRepository;

/**
 * Current-user helper. Reads the session only if the browser already has one.
 */
final class Auth
{
    private static array|false|null $user = null;

    public static function user(): ?array
    {
        if (self::$user === null) {
            self::$user = false;
            if (Database::isConfigured() && Session::resume()) {
                $id = Session::get('uid');
                if (is_int($id)) {
                    try {
                        self::$user = UserRepository::find($id) ?? false;
                    } catch (\Throwable $e) {
                        Logger::error('Auth lookup failed: ' . $e->getMessage());
                    }
                }
            }
        }
        return self::$user ?: null;
    }

    public static function id(): ?int
    {
        return self::user() ? (int) self::user()['id'] : null;
    }

    public static function login(array $user): void
    {
        Session::start();
        Session::regenerate();
        Session::set('uid', (int) $user['id']);
        Session::set('_csrf', bin2hex(random_bytes(32)));
        self::$user = $user;
        UserRepository::touchLogin((int) $user['id']);
    }

    public static function logout(): void
    {
        Session::resume();
        Session::destroy();
        self::$user = false;
    }

    /** Client IP (X-Forwarded-For only when behind a trusted proxy such as Railway). */
    public static function ip(Request $request): string
    {
        $ip = (string) ($request->server['REMOTE_ADDR'] ?? '0.0.0.0');
        if (Config::get('security.trust_proxy')) {
            $fwd = trim(explode(',', (string) ($request->server['HTTP_X_FORWARDED_FOR'] ?? ''))[0]);
            if (filter_var($fwd, FILTER_VALIDATE_IP)) {
                $ip = $fwd;
            }
        }
        return substr($ip, 0, 45);
    }
}
