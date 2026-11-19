<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Config;
use App\Core\Csrf;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Models\UserRepository;
use App\Services\Auth;
use App\Services\Mailer;
use App\Services\RateLimiter;
use App\Services\Validator;

/**
 * JSON auth API. Every POST requires the CSRF token (X-CSRF-Token header).
 * Error messages are friendly and never reveal whether an email is registered.
 */
final class AuthController
{
    private static function fail(string $error, string $message, int $status = 422, array $extra = []): Response
    {
        return Response::json(['ok' => false, 'error' => $error, 'message' => $message] + $extra, $status);
    }

    public static function guard(Request $request): ?Response
    {
        if (!Database::isConfigured()) {
            return self::fail('unavailable', 'Accounts aren’t available on this server yet.', 503);
        }
        if (!Csrf::verify($request)) {
            return self::fail('csrf', 'Your session has expired. Please refresh the page and try again.', 403);
        }
        return null;
    }

    /** GET /api/session – who am I + CSRF token (starts a session). */
    public function session(Request $request): Response
    {
        $user = Auth::user();
        return Response::json([
            'ok' => true,
            'user' => $user ? UserRepository::publicView($user) : null,
            'csrf' => Csrf::token(),
            'accounts' => Database::isConfigured(),
        ]);
    }

    /** POST /api/auth/register {displayName, email, password} */
    public function register(Request $request): Response
    {
        if ($r = self::guard($request)) {
            return $r;
        }
        $in = $request->json();
        $ip = Auth::ip($request);
        if (RateLimiter::tooMany('register', $ip, '', 5, 0, 3600)) {
            return self::fail('rate_limited', 'Too many accounts created from here. Please try again later.', 429);
        }
        $name = Validator::displayName($in['displayName'] ?? null);
        $email = Validator::email($in['email'] ?? null);
        $password = Validator::password($in['password'] ?? null);
        $errors = array_filter([
            'displayName' => $name === null ? 'Please enter a name of up to 40 characters.' : null,
            'email' => $email === null ? 'Please enter a valid email address.' : null,
            'password' => $password === null ? 'Use at least 8 characters for your password.' : null,
        ]);
        if ($errors) {
            return self::fail('invalid', 'Please check the highlighted fields.', 422, ['fields' => $errors]);
        }
        RateLimiter::hit('register', $ip);
        if (UserRepository::findByEmail($email)) {
            return self::fail('invalid', 'Please check the highlighted fields.', 422,
                ['fields' => ['email' => 'That email already has an account – try logging in instead.']]);
        }
        $id = UserRepository::create($email, UserRepository::hashPassword($password), $name);
        $user = UserRepository::find($id);
        Auth::login($user);
        return Response::json(['ok' => true, 'user' => UserRepository::publicView($user), 'csrf' => Csrf::token()], 201);
    }

    /** POST /api/auth/login {email, password} */
    public function login(Request $request): Response
    {
        if ($r = self::guard($request)) {
            return $r;
        }
        $in = $request->json();
        $ip = Auth::ip($request);
        $email = Validator::email($in['email'] ?? null) ?? '';
        if (RateLimiter::tooMany('login', $ip, $email, 20, 5, 900)) {
            return self::fail('rate_limited', 'Too many attempts. Please wait 15 minutes and try again.', 429);
        }
        $user = $email !== '' ? UserRepository::findByEmail($email) : null;
        $password = is_string($in['password'] ?? null) ? $in['password'] : '';
        // Always run a hash check so response time doesn't reveal whether the email exists.
        $hash = $user['password_hash'] ?? UserRepository::hashPassword(bin2hex(random_bytes(8)));
        $ok = password_verify($password, $hash) && $user !== null;
        if (!$ok) {
            RateLimiter::hit('login', $ip, $email);
            return self::fail('invalid_credentials', 'That email and password don’t match. Please try again.', 401);
        }
        if (UserRepository::needsRehash($user['password_hash'])) {
            UserRepository::updatePassword((int) $user['id'], UserRepository::hashPassword($password));
        }
        RateLimiter::clear('login', $email);
        Auth::login($user);
        return Response::json(['ok' => true, 'user' => UserRepository::publicView($user), 'csrf' => Csrf::token()]);
    }

    /** POST /api/auth/logout */
    public function logout(Request $request): Response
    {
        if ($r = self::guard($request)) {
            return $r;
        }
        Auth::logout();
        return Response::json(['ok' => true]);
    }

    /** POST /api/auth/forgot {email} – always "ok" (no account enumeration). */
    public function forgot(Request $request): Response
    {
        if ($r = self::guard($request)) {
            return $r;
        }
        $ip = Auth::ip($request);
        $email = Validator::email($request->json()['email'] ?? null);
        if ($email === null) {
            return self::fail('invalid', 'Please enter a valid email address.', 422, ['fields' => ['email' => 'Please enter a valid email address.']]);
        }
        if (RateLimiter::tooMany('forgot', $ip, $email, 10, 3, 3600)) {
            return self::fail('rate_limited', 'We’ve sent a few emails already. Please check your inbox or try again in an hour.', 429);
        }
        RateLimiter::hit('forgot', $ip, $email);
        $user = UserRepository::findByEmail($email);
        if ($user) {
            $token = bin2hex(random_bytes(32));
            Database::run('DELETE FROM password_resets WHERE email = ? OR expires_at < UTC_TIMESTAMP()', [$email]);
            Database::run('INSERT INTO password_resets (email, token_hash, expires_at) VALUES (?, ?, UTC_TIMESTAMP() + INTERVAL 1 HOUR)',
                [$email, hash('sha256', $token)]);
            $base = rtrim((string) Config::get('app.base_url', ''), '/');
            $link = $base . url('/reset-password') . '?token=' . $token;
            $name = $user['display_name'];
            $app = (string) Config::get('app.name', 'KeyQuest');
            Mailer::send($email, "Reset your {$app} password",
                "Hello {$name},\n\nSomeone (hopefully you) asked to reset your {$app} password.\n"
                . "Choose a new password using this link – it works for one hour:\n\n{$link}\n\n"
                . "If you didn’t ask for this, you can ignore this email; your password won’t change.\n\nHappy typing!\nPip and the {$app} team\n");
        }
        return Response::json(['ok' => true, 'message' => 'If that email has an account, we’ve sent a link to reset the password.']);
    }

    /** POST /api/auth/reset {token, password} */
    public function reset(Request $request): Response
    {
        if ($r = self::guard($request)) {
            return $r;
        }
        $in = $request->json();
        $ip = Auth::ip($request);
        if (RateLimiter::tooMany('reset', $ip, '', 10, 0, 3600)) {
            return self::fail('rate_limited', 'Too many attempts. Please try again later.', 429);
        }
        RateLimiter::hit('reset', $ip);
        $token = is_string($in['token'] ?? null) && preg_match('/^[a-f0-9]{64}$/', $in['token']) ? $in['token'] : null;
        $password = Validator::password($in['password'] ?? null);
        if ($password === null) {
            return self::fail('invalid', 'Use at least 8 characters for your password.', 422, ['fields' => ['password' => 'Use at least 8 characters for your password.']]);
        }
        $row = $token ? Database::one('SELECT * FROM password_resets WHERE token_hash = ? AND expires_at > UTC_TIMESTAMP()', [hash('sha256', $token)]) : null;
        $user = $row ? UserRepository::findByEmail($row['email']) : null;
        if (!$user) {
            return self::fail('invalid_token', 'This reset link has expired or already been used. Please ask for a new one.', 400);
        }
        UserRepository::updatePassword((int) $user['id'], UserRepository::hashPassword($password));
        Database::run('DELETE FROM password_resets WHERE email = ?', [$row['email']]);
        Auth::login($user);
        return Response::json(['ok' => true, 'user' => UserRepository::publicView($user), 'csrf' => Csrf::token()]);
    }
}
