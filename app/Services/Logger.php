<?php
declare(strict_types=1);

namespace App\Services;

/**
 * Append-only daily log files in storage/logs.
 */
final class Logger
{
    private static string $dir = '';

    public static function setDirectory(string $dir): void
    {
        self::$dir = rtrim($dir, '/');
    }

    public static function error(string $message, array $context = []): void
    {
        self::write('ERROR', $message, $context);
    }

    public static function info(string $message, array $context = []): void
    {
        self::write('INFO', $message, $context);
    }

    private static function write(string $level, string $message, array $context): void
    {
        if (self::$dir === '') {
            error_log("[{$level}] {$message}");
            return;
        }
        if (!is_dir(self::$dir)) {
            @mkdir(self::$dir, 0750, true);
        }
        $line = sprintf(
            "[%s] %s: %s %s\n",
            date('c'),
            $level,
            str_replace(["\r", "\n"], ' ', $message),
            $context ? json_encode($context, JSON_UNESCAPED_SLASHES) : ''
        );
        if (@file_put_contents(self::$dir . '/app-' . date('Y-m-d') . '.log', $line, FILE_APPEND | LOCK_EX) === false) {
            error_log(trim($line));
        }
    }
}
