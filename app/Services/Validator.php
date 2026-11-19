<?php
declare(strict_types=1);

namespace App\Services;

/**
 * Small input validators. Each returns a cleaned value or null when invalid.
 */
final class Validator
{
    public static function email(mixed $v): ?string
    {
        if (!is_string($v)) {
            return null;
        }
        $v = strtolower(trim($v));
        return strlen($v) <= 190 && filter_var($v, FILTER_VALIDATE_EMAIL) ? $v : null;
    }

    /** 8–200 characters, not just spaces. */
    public static function password(mixed $v): ?string
    {
        return is_string($v) && mb_strlen($v) >= 8 && mb_strlen($v) <= 200 && trim($v) !== '' ? $v : null;
    }

    /** 1–40 visible characters, control characters removed. */
    public static function displayName(mixed $v): ?string
    {
        if (!is_string($v)) {
            return null;
        }
        $v = trim((string) preg_replace('/[\p{C}]+/u', '', $v));
        $v = (string) preg_replace('/\s+/u', ' ', $v);
        return $v !== '' && mb_strlen($v) <= 40 ? $v : null;
    }

    public static function slug(mixed $v, int $max = 64): ?string
    {
        return is_string($v) && preg_match('/^[a-z0-9][a-z0-9-]{0,' . ($max - 1) . '}$/', $v) ? $v : null;
    }

    public static function day(mixed $v): ?string
    {
        if (!is_string($v) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)) {
            return null;
        }
        [$y, $m, $d] = array_map('intval', explode('-', $v));
        return checkdate($m, $d, $y) ? $v : null;
    }

    /** ISO date-time → 'Y-m-d H:i:s' UTC (not in the future by more than a day). */
    public static function dateTime(mixed $v): ?string
    {
        if (!is_string($v) || strlen($v) > 40) {
            return null;
        }
        $ts = strtotime($v);
        if ($ts === false || $ts > time() + 86400 || $ts < strtotime('2020-01-01')) {
            return null;
        }
        return gmdate('Y-m-d H:i:s', $ts);
    }

    public static function number(mixed $v, float $min, float $max): ?float
    {
        if (!is_int($v) && !is_float($v)) {
            return null;
        }
        $f = (float) $v;
        return is_finite($f) && $f >= $min && $f <= $max ? $f : null;
    }
}
