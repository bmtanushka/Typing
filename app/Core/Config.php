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
        'security' => ['force_https' => false],
    ];

    public static function load(string $file): void
    {
        $user = is_file($file) ? require $file : [];
        self::$items = array_replace_recursive(self::DEFAULTS, is_array($user) ? $user : []);
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
