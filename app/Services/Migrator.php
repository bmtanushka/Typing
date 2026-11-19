<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Database;

/**
 * Applies install/schema.sql (every statement is idempotent: CREATE TABLE IF NOT EXISTS).
 */
final class Migrator
{
    public static function statements(string $sql): array
    {
        $sql = (string) preg_replace('/^\s*--.*$/m', '', $sql);
        return array_values(array_filter(array_map('trim', preg_split('/;\s*$/m', $sql) ?: [])));
    }

    /** @return int number of statements run */
    public static function migrate(): int
    {
        $n = 0;
        foreach (self::statements((string) file_get_contents(KQ_ROOT . '/install/schema.sql')) as $stmt) {
            Database::pdo()->exec($stmt);
            $n++;
        }
        return $n;
    }

    public static function isInstalled(): bool
    {
        try {
            return (bool) Database::one("SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'guest_merges'")['n'];
        } catch (\Throwable) {
            return false;
        }
    }

    public static function lockFile(): string
    {
        return KQ_ROOT . '/storage/installed.lock';
    }
}
