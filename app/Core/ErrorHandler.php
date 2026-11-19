<?php
declare(strict_types=1);

namespace App\Core;

use App\Services\Logger;

/**
 * Converts PHP errors to exceptions, logs every failure and shows a
 * friendly error page (details only in debug mode).
 */
final class ErrorHandler
{
    private static bool $debug = false;

    public static function register(bool $debug, string $logDir): void
    {
        self::$debug = $debug;
        Logger::setDirectory($logDir);

        error_reporting(E_ALL);
        ini_set('display_errors', '0');
        ini_set('log_errors', '1');

        set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
            if (!(error_reporting() & $severity)) {
                return false;
            }
            throw new \ErrorException($message, 0, $severity, $file, $line);
        });

        set_exception_handler([self::class, 'handle']);

        register_shutdown_function(static function (): void {
            $err = error_get_last();
            if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
                self::handle(new \ErrorException($err['message'], 0, $err['type'], $err['file'], $err['line']));
            }
        });
    }

    public static function handle(\Throwable $e): void
    {
        Logger::error($e->getMessage(), [
            'type' => $e::class,
            'file' => $e->getFile() . ':' . $e->getLine(),
            'uri'  => $_SERVER['REQUEST_URI'] ?? '',
            'trace' => $e->getTraceAsString(),
        ]);

        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        $isApi = str_contains($_SERVER['REQUEST_URI'] ?? '', '/api/');
        try {
            if ($isApi) {
                $res = Response::json(['ok' => false, 'error' => 'server_error'], 500);
            } else {
                $res = Response::html(View::page('errors/500', [
                    'title' => 'Something went wrong',
                    'error' => self::$debug ? $e : null,
                ]), 500);
            }
            send_security_headers();
            $res->send();
        } catch (\Throwable) {
            // Last resort: never leak details.
            if (!headers_sent()) {
                http_response_code(500);
                header('Content-Type: text/plain; charset=UTF-8');
            }
            echo 'Sorry, something went wrong. Please try again shortly.';
        }
        exit(1);
    }
}
