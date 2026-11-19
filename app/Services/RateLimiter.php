<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Database;

/**
 * Database-backed rate limiting (login_attempts table) – works on shared hosting.
 */
final class RateLimiter
{
    /** @param int $windowSec time window; limits are counts within it (0 = no limit) */
    public static function tooMany(string $action, string $ip, string $email, int $maxPerIp, int $maxPerEmail, int $windowSec): bool
    {
        $since = gmdate('Y-m-d H:i:s', time() - $windowSec);
        if ($maxPerIp > 0) {
            $n = (int) (Database::one('SELECT COUNT(*) AS n FROM login_attempts WHERE action = ? AND ip = ? AND attempted_at > ?', [$action, $ip, $since])['n'] ?? 0);
            if ($n >= $maxPerIp) {
                return true;
            }
        }
        if ($maxPerEmail > 0 && $email !== '') {
            $n = (int) (Database::one('SELECT COUNT(*) AS n FROM login_attempts WHERE action = ? AND email = ? AND attempted_at > ?', [$action, $email, $since])['n'] ?? 0);
            if ($n >= $maxPerEmail) {
                return true;
            }
        }
        return false;
    }

    public static function hit(string $action, string $ip, string $email = ''): void
    {
        Database::run('INSERT INTO login_attempts (action, ip, email, attempted_at) VALUES (?, ?, ?, UTC_TIMESTAMP())', [$action, $ip, $email]);
        if (random_int(1, 50) === 1) {
            Database::run('DELETE FROM login_attempts WHERE attempted_at < UTC_TIMESTAMP() - INTERVAL 2 DAY');
        }
    }

    public static function clear(string $action, string $email): void
    {
        Database::run('DELETE FROM login_attempts WHERE action = ? AND email = ?', [$action, $email]);
    }
}
