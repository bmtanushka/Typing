<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Synchroniser-token CSRF protection. The token lives in the session and must be sent
 * back in the X-CSRF-Token header (fetch) on every state-changing request.
 */
final class Csrf
{
    public static function token(): string
    {
        Session::start();
        $t = Session::get('_csrf');
        if (!is_string($t) || strlen($t) !== 64) {
            $t = bin2hex(random_bytes(32));
            Session::set('_csrf', $t);
        }
        return $t;
    }

    public static function verify(Request $request): bool
    {
        if (!Session::resume()) {
            return false;
        }
        $expected = Session::get('_csrf');
        $given = (string) ($request->server['HTTP_X_CSRF_TOKEN'] ?? ($request->json()['_csrf'] ?? ''));
        return is_string($expected) && $expected !== '' && hash_equals($expected, $given);
    }
}
