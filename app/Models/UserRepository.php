<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;

final class UserRepository
{
    public static function findByEmail(string $email): ?array
    {
        return Database::one('SELECT * FROM users WHERE email = ?', [$email]);
    }

    public static function find(int $id): ?array
    {
        return Database::one('SELECT * FROM users WHERE id = ?', [$id]);
    }

    public static function create(string $email, string $passwordHash, string $displayName): int
    {
        Database::run(
            'INSERT INTO users (email, password_hash, display_name, created_at, last_login_at) VALUES (?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())',
            [$email, $passwordHash, $displayName]
        );
        return (int) Database::pdo()->lastInsertId();
    }

    public static function touchLogin(int $id): void
    {
        Database::run('UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?', [$id]);
    }

    public static function updatePassword(int $id, string $hash): void
    {
        Database::run('UPDATE users SET password_hash = ? WHERE id = ?', [$hash, $id]);
    }

    public static function updateProfile(int $id, string $displayName, string $email): void
    {
        Database::run('UPDATE users SET display_name = ?, email = ? WHERE id = ?', [$displayName, $email, $id]);
    }

    public static function delete(int $id): void
    {
        Database::run('DELETE FROM users WHERE id = ?', [$id]);
    }

    /** Public view of a user (never includes the password hash). */
    public static function publicView(array $u): array
    {
        return ['id' => (int) $u['id'], 'email' => $u['email'], 'displayName' => $u['display_name'], 'createdAt' => $u['created_at']];
    }

    public static function hashPassword(string $password): string
    {
        return password_hash($password, defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT);
    }

    public static function needsRehash(string $hash): bool
    {
        return password_needs_rehash($hash, defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT);
    }
}
