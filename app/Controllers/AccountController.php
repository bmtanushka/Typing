<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\UserRepository;
use App\Services\Auth;
use App\Services\ProgressService;
use App\Services\Validator;

/**
 * Account settings API: profile, password, delete, export.
 */
final class AccountController
{
    private static function fail(string $message, array $fields = [], int $status = 422): Response
    {
        return Response::json(['ok' => false, 'error' => 'invalid', 'message' => $message, 'fields' => $fields], $status);
    }

    private static function pre(Request $request): ?Response
    {
        if ($r = AuthController::guard($request)) {
            return $r;
        }
        return Auth::id() === null ? Response::json(['ok' => false, 'error' => 'unauthenticated', 'message' => 'Please log in.'], 401) : null;
    }

    /** POST /api/account/profile {displayName, email} */
    public function profile(Request $request): Response
    {
        if ($r = self::pre($request)) {
            return $r;
        }
        $in = $request->json();
        $name = Validator::displayName($in['displayName'] ?? null);
        $email = Validator::email($in['email'] ?? null);
        $fields = array_filter([
            'displayName' => $name === null ? 'Please enter a name of up to 40 characters.' : null,
            'email' => $email === null ? 'Please enter a valid email address.' : null,
        ]);
        if ($fields) {
            return self::fail('Please check the highlighted fields.', $fields);
        }
        $existing = UserRepository::findByEmail($email);
        if ($existing && (int) $existing['id'] !== Auth::id()) {
            return self::fail('Please check the highlighted fields.', ['email' => 'That email is already used by another account.']);
        }
        UserRepository::updateProfile(Auth::id(), $name, $email);
        return Response::json(['ok' => true, 'user' => UserRepository::publicView(UserRepository::find(Auth::id()))]);
    }

    /** POST /api/account/password {current, password} */
    public function password(Request $request): Response
    {
        if ($r = self::pre($request)) {
            return $r;
        }
        $in = $request->json();
        $user = Auth::user();
        if (!password_verify((string) ($in['current'] ?? ''), $user['password_hash'])) {
            return self::fail('Your current password isn’t right.', ['current' => 'Your current password isn’t right.']);
        }
        $password = Validator::password($in['password'] ?? null);
        if ($password === null) {
            return self::fail('Use at least 8 characters for your new password.', ['password' => 'Use at least 8 characters for your new password.']);
        }
        UserRepository::updatePassword(Auth::id(), UserRepository::hashPassword($password));
        return Response::json(['ok' => true]);
    }

    /** POST /api/account/delete {password} */
    public function delete(Request $request): Response
    {
        if ($r = self::pre($request)) {
            return $r;
        }
        $user = Auth::user();
        if (!password_verify((string) ($request->json()['password'] ?? ''), $user['password_hash'])) {
            return self::fail('That password isn’t right.', ['password' => 'That password isn’t right.']);
        }
        UserRepository::delete(Auth::id());
        Auth::logout();
        return Response::json(['ok' => true]);
    }

    /** GET /api/account/export – everything we hold, as a JSON download. */
    public function export(Request $request): Response
    {
        if (Auth::id() === null) {
            return Response::json(['ok' => false, 'error' => 'unauthenticated'], 401);
        }
        $data = [
            'exportedAt' => gmdate('c'),
            'account' => UserRepository::publicView(Auth::user()),
            'progress' => ProgressService::state(Auth::id()),
        ];
        $res = Response::json($data);
        return new Response($res->body, 200, $res->headers + [
            'Content-Disposition' => 'attachment; filename="keyquest-account-' . gmdate('Y-m-d') . '.json"',
        ]);
    }
}
