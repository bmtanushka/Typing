<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Read-only configuration store with dot-notation access.
 * Safe production defaults are merged under the values from config.php.
 */
final class Config
{
    private static array $items = [];

    private const DEFAULTS = [
        'app' => [
            'name'      => 'KeyQuest',
            'env'       => 'production',
            'debug'     => false,
            'base_path' => null,
            'base_url'  => '',
            'timezone'  => 'Europe/London',
        ],
        'security' => ['force_https' => false, 'trust_proxy' => false],
    ];

    /**
     * Environment variables that override config.php (used on Railway/Docker).
     * First variable found wins; MYSQL* are the names Railway's MySQL add-on provides.
     */
    private const ENV_MAP = [
        'app.env'              => ['APP_ENV'],
        'app.debug'            => ['APP_DEBUG'],
        'app.base_path'        => ['APP_BASE_PATH'],
        'app.base_url'         => ['APP_BASE_URL'],
        'app.contact_email'    => ['CONTACT_EMAIL'],
        'db.host'              => ['DB_HOST', 'MYSQLHOST'],
        'db.port'              => ['DB_PORT', 'MYSQLPORT'],
        'db.name'              => ['DB_NAME', 'MYSQLDATABASE'],
        'db.user'              => ['DB_USER', 'MYSQLUSER'],
        'db.pass'              => ['DB_PASS', 'MYSQLPASSWORD'],
        'mail.driver'          => ['MAIL_DRIVER'],
        'mail.from_email'      => ['MAIL_FROM_EMAIL'],
        'mail.smtp.host'       => ['SMTP_HOST'],
        'mail.smtp.port'       => ['SMTP_PORT'],
        'mail.smtp.username'   => ['SMTP_USERNAME'],
        'mail.smtp.password'   => ['SMTP_PASSWORD'],
        'mail.from_name'       => ['MAIL_FROM_NAME'],
        'mail.smtp.encryption' => ['SMTP_ENCRYPTION'],
        'security.force_https' => ['FORCE_HTTPS'],
        'security.trust_proxy' => ['TRUST_PROXY'],
        'app.asset_version'    => ['ASSET_VERSION'],
    ];

    public static function load(string $file): void
    {
        $user = is_file($file) ? require $file : [];
        self::$items = array_replace_recursive(self::DEFAULTS, is_array($user) ? $user : []);
        self::applyEnv();
    }

    private static function applyEnv(): void
    {
        foreach (self::ENV_MAP as $key => $names) {
            foreach ($names as $name) {
                $value = getenv($name);
                if ($value === false || $value === '') {
                    continue;
                }
                $bool = filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
                $value = match (true) {
                    in_array($key, ['app.debug', 'security.force_https', 'security.trust_proxy'], true) => (bool) $bool,
                    str_ends_with($key, '.port') && ctype_digit($value) => (int) $value,
                    default => $value,
                };
                $ref = &self::$items;
                foreach (explode('.', $key) as $part) {
                    $ref = &$ref[$part];
                }
                $ref = $value;
                unset($ref);
                break;
            }
        }
    }

    /** For tests. */
    public static function set(array $items): void
    {
        self::$items = array_replace_recursive(self::DEFAULTS, $items);
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $value = self::$items;
        foreach (explode('.', $key) as $part) {
            if (!is_array($value) || !array_key_exists($part, $value)) {
                return $default;
            }
            $value = $value[$part];
        }
        return $value;
    }

    public static function isDev(): bool
    {
        return self::get('app.env') === 'development';
    }
}
