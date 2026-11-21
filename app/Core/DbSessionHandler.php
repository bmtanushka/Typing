<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Database-backed PHP sessions (table `sessions`). Logins survive redeploys and work across
 * several servers. Implements strict-mode id validation: unknown ids are never accepted.
 */
final class DbSessionHandler implements \SessionHandlerInterface, \SessionUpdateTimestampHandlerInterface
{
    public function __construct(private readonly int $lifetime) {}

    public function open(string $path, string $name): bool
    {
        return true;
    }

    public function close(): bool
    {
        return true;
    }

    public function read(string $id): string|false
    {
        $row = Database::one('SELECT data FROM sessions WHERE id = ? AND expires_at > ?', [$id, time()]);
        return $row ? (string) $row['data'] : '';
    }

    public function write(string $id, string $data): bool
    {
        Database::run(
            'INSERT INTO sessions (id, data, expires_at) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE data = VALUES(data), expires_at = VALUES(expires_at)',
            [$id, $data, time() + $this->lifetime]
        );
        return true;
    }

    public function destroy(string $id): bool
    {
        Database::run('DELETE FROM sessions WHERE id = ?', [$id]);
        return true;
    }

    public function gc(int $max_lifetime): int|false
    {
        return Database::run('DELETE FROM sessions WHERE expires_at < ?', [time()]);
    }

    /** Strict mode: only ids we issued (and that haven't expired) are valid. */
    public function validateId(string $id): bool
    {
        return (bool) Database::one('SELECT 1 AS ok FROM sessions WHERE id = ? AND expires_at > ?', [$id, time()]);
    }

    public function updateTimestamp(string $id, string $data): bool
    {
        Database::run('UPDATE sessions SET expires_at = ? WHERE id = ?', [time() + $this->lifetime, $id]);
        return true;
    }
}
