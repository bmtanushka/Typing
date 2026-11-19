<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\Auth;
use App\Services\ProgressService;

/**
 * Progress sync for signed-in learners.
 */
final class ProgressController
{
    private static function needUser(): ?Response
    {
        return Auth::id() === null
            ? Response::json(['ok' => false, 'error' => 'unauthenticated', 'message' => 'Please log in.'], 401)
            : null;
    }

    /** GET /api/progress */
    public function show(Request $request): Response
    {
        if ($r = self::needUser()) {
            return $r;
        }
        return Response::json(['ok' => true, 'state' => ProgressService::state(Auth::id())]);
    }

    /** POST /api/progress/sync {events: [...], settings?: {...}} */
    public function sync(Request $request): Response
    {
        if (($r = AuthController::guard($request)) || ($r = self::needUser())) {
            return $r;
        }
        $in = $request->json();
        $out = ProgressService::applyEvents(Auth::id(), is_array($in['events'] ?? null) ? $in['events'] : []);
        if (is_array($in['skipped'] ?? null)) {
            ProgressService::addSkippedPublic(Auth::id(), $in['skipped']);
        }
        if (is_array($in['settings'] ?? null)) {
            ProgressService::saveSettings(Auth::id(), $in['settings']);
        }
        return Response::json(['ok' => true] + $out + ['state' => ProgressService::state(Auth::id())]);
    }

    /** POST /api/progress/merge {mergeId, guest: {...}} – once, straight after sign-in. */
    public function merge(Request $request): Response
    {
        if (($r = AuthController::guard($request)) || ($r = self::needUser())) {
            return $r;
        }
        $in = $request->json();
        $mergeId = is_string($in['mergeId'] ?? null) && preg_match('/^[a-f0-9-]{36}$/', $in['mergeId']) ? $in['mergeId'] : null;
        if ($mergeId === null || !is_array($in['guest'] ?? null)) {
            return Response::json(['ok' => false, 'error' => 'invalid', 'message' => 'Nothing to merge.'], 422);
        }
        $merged = ProgressService::mergeGuest(Auth::id(), $in['guest'], $mergeId);
        return Response::json(['ok' => true, 'merged' => $merged, 'state' => ProgressService::state(Auth::id())]);
    }
}
