<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Minimal immutable HTTP request.
 */
final class Request
{
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $query = [],
        public readonly array $body = [],
        public readonly array $server = [],
    ) {
    }

    public static function fromGlobals(string $basePath): self
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $path = self::normalisePath($_SERVER['REQUEST_URI'] ?? '/', $basePath);
        return new self($method, $path, $_GET, $_POST, $_SERVER);
    }

    /**
     * Strip query string and base path, decode, collapse slashes,
     * drop the trailing slash (except for "/").
     */
    public static function normalisePath(string $uri, string $basePath): string
    {
        // Don't use parse_url(): it treats a leading "//x" as a host name.
        $path = rawurldecode((string) preg_replace('/[?#].*$/s', '', $uri));
        $path = preg_replace('#/+#', '/', $path) ?? '/';

        $basePath = rtrim($basePath, '/');
        if ($basePath !== '' && ($path === $basePath || str_starts_with($path, $basePath . '/'))) {
            $path = substr($path, strlen($basePath));
        }
        if ($path === '' || $path === false) {
            $path = '/';
        }
        if ($path[0] !== '/') {
            $path = '/' . $path;
        }
        if ($path !== '/') {
            $path = rtrim($path, '/');
        }
        return $path;
    }

    public function isApi(): bool
    {
        return $this->path === '/api' || str_starts_with($this->path, '/api/');
    }

    /** Decoded JSON request body (empty array if none/invalid). */
    public function json(): array
    {
        static $cache = null;
        if ($cache === null) {
            $raw = file_get_contents('php://input') ?: '';
            $data = json_decode($raw, true);
            $cache = is_array($data) ? $data : [];
        }
        return $cache;
    }
}
