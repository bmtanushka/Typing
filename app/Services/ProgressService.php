<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Database;

/**
 * Server side of progress sync.
 *
 * The browser records activity locally (same rules for guests and members) and, when signed
 * in, queues one EVENT per activity. Events carry a client-generated id so replays are
 * harmless (results.client_id is unique per user). The server validates every event for
 * plausibility before applying it.
 */
final class ProgressService
{
    public const MAX_WPM = 250;
    public const MAX_RAW_WPM = 300;
    public const MAX_EVENT_XP = 300;
    public const SETTINGS_KEYS = ['theme', 'fontSize', 'layout', 'sound', 'showKeyboard', 'showHands', 'allowBackspace'];

    private static ?array $badgeIds = null;

    public static function badgeIds(): array
    {
        if (self::$badgeIds === null) {
            $d = json_decode((string) file_get_contents(KQ_ROOT . '/content/badges.json'), true);
            self::$badgeIds = array_column($d['badges'] ?? [], 'id');
        }
        return self::$badgeIds;
    }

    /* ------------------------------------------------------------ validation */

    /**
     * Normalise a result-like event. Returns [array $clean, ?string $reason].
     * Rejects impossible numbers (e.g. > 250 WPM, more characters than time allows).
     */
    public static function validateEvent(mixed $e): array
    {
        if (!is_array($e)) {
            return [null, 'not_object'];
        }
        $id = $e['id'] ?? null;
        if (!is_string($id) || !preg_match('/^[A-Za-z0-9_-]{8,64}$/', $id)) {
            return [null, 'bad_id'];
        }
        $type = $e['type'] ?? null;
        if (!in_array($type, ['lesson', 'test', 'game', 'practice'], true)) {
            return [null, 'bad_type'];
        }
        $ref = $e['ref'] ?? '';
        if (!is_string($ref) || ($ref !== '' && !Validator::slug($ref))) {
            return [null, 'bad_ref'];
        }
        $at = Validator::dateTime($e['at'] ?? null);
        $day = Validator::day($e['day'] ?? null);
        if ($at === null || $day === null) {
            return [null, 'bad_time'];
        }
        $wpm = Validator::number($e['wpm'] ?? 0, 0, self::MAX_WPM);
        $raw = Validator::number($e['rawWpm'] ?? 0, 0, self::MAX_RAW_WPM);
        $acc = Validator::number($e['accuracy'] ?? 0, 0, 100);
        $dur = Validator::number($e['durationMs'] ?? 0, 0, 3 * 3600 * 1000);
        $chars = Validator::number($e['chars'] ?? 0, 0, 200000);
        $stars = Validator::number($e['stars'] ?? 0, 0, 3);
        $score = Validator::number($e['score'] ?? 0, 0, 10000000);
        $xp = Validator::number($e['xp'] ?? 0, 0, self::MAX_EVENT_XP);
        foreach ([$wpm, $raw, $acc, $dur, $chars, $stars, $score, $xp] as $v) {
            if ($v === null) {
                return [null, 'implausible'];
            }
        }
        // Characters typed must fit in the time taken (≈ 400 WPM ceiling, small allowance).
        if ($type !== 'game' && $chars > 10 && $chars > ($dur / 1000) * 34 + 10) {
            return [null, 'implausible'];
        }
        if ($type === 'lesson' && Validator::slug($ref) === null) {
            return [null, 'bad_ref'];
        }

        $keyStats = [];
        foreach (array_slice((array) ($e['keyStats'] ?? []), 0, 120, true) as $ch => $s) {
            if (!is_string($ch) || mb_strlen($ch) !== 1 || !is_array($s)) {
                continue;
            }
            $a = Validator::number($s['attempts'] ?? 0, 0, 100000);
            $er = Validator::number($s['errors'] ?? 0, 0, 100000);
            $lt = Validator::number($s['latencyTotal'] ?? 0, 0, 1e9);
            $lc = Validator::number($s['latencyCount'] ?? 0, 0, 100000);
            if ($a === null || $er === null || $lt === null || $lc === null || $er > $a) {
                continue;
            }
            $keyStats[$ch] = [(int) $a, (int) $er, (int) $lt, (int) $lc];
        }
        $badges = array_values(array_intersect(array_filter((array) ($e['badges'] ?? []), 'is_string'), self::badgeIds()));
        $skipped = array_values(array_filter(array_map([Validator::class, 'slug'], array_slice((array) ($e['skipped'] ?? []), 0, 100))));

        return [[
            'id' => $id, 'type' => $type, 'ref' => $ref, 'at' => $at, 'day' => $day,
            'wpm' => round($wpm, 1), 'rawWpm' => round($raw, 1), 'accuracy' => round($acc, 1),
            'durationMs' => (int) $dur, 'chars' => (int) $chars, 'stars' => (int) $stars,
            'score' => (int) $score, 'xp' => (int) $xp, 'keyStats' => $keyStats,
            'badges' => $badges, 'skipped' => $skipped,
        ], null];
    }

    /* ------------------------------------------------------------- applying */

    /** @return array{accepted: string[], rejected: array<string,string>} */
    public static function applyEvents(int $userId, array $events): array
    {
        $accepted = [];
        $rejected = [];
        foreach (array_slice($events, 0, 50) as $raw) {
            [$e, $why] = self::validateEvent($raw);
            if ($e === null) {
                $id = is_array($raw) && is_string($raw['id'] ?? null) ? substr($raw['id'], 0, 64) : '?';
                $rejected[$id] = $why;
                continue;
            }
            Database::transaction(function () use ($userId, $e) {
                $inserted = Database::run(
                    'INSERT IGNORE INTO results (user_id, client_id, type, ref_id, wpm, raw_wpm, accuracy, duration_ms, chars, stars, score, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [$userId, $e['id'], $e['type'], $e['ref'], $e['wpm'], $e['rawWpm'], $e['accuracy'], $e['durationMs'], $e['chars'], $e['stars'], $e['score'], $e['at']]
                );
                if ($inserted === 0) {
                    return; // already applied – replay is a no-op
                }
                if ($e['type'] === 'lesson') {
                    self::upsertLesson($userId, $e['ref'], $e['stars'], $e['wpm'], $e['accuracy'], 1, $e['stars'] > 0 ? $e['at'] : null);
                }
                if ($e['type'] === 'game' && $e['ref'] !== '') {
                    self::upsertGame($userId, $e['ref'], $e['score']);
                }
                self::addKeyStats($userId, $e['keyStats']);
                self::addBadges($userId, $e['badges'], $e['at']);
                self::addSkipped($userId, $e['skipped']);
                Database::run('UPDATE users SET xp = LEAST(xp + ?, 4000000000) WHERE id = ?', [$e['xp'], $userId]);
                self::bumpStreak($userId, $e['day']);
            });
            $accepted[] = $e['id'];
        }
        return ['accepted' => $accepted, 'rejected' => $rejected];
    }

    private static function upsertLesson(int $uid, string $lessonId, int $stars, float $wpm, float $acc, int $attempts, ?string $completedAt): void
    {
        $passed = $stars > 0;
        Database::run(
            'INSERT INTO lesson_progress (user_id, lesson_id, stars, best_wpm, best_accuracy, attempts, completed_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               stars = GREATEST(stars, VALUES(stars)),
               best_wpm = IF(VALUES(stars) > 0, GREATEST(best_wpm, VALUES(best_wpm)), best_wpm),
               best_accuracy = IF(VALUES(stars) > 0, GREATEST(best_accuracy, VALUES(best_accuracy)), best_accuracy),
               attempts = attempts + VALUES(attempts),
               completed_at = COALESCE(completed_at, VALUES(completed_at))',
            [$uid, $lessonId, $stars, $passed ? $wpm : 0, $passed ? $acc : 0, $attempts, $completedAt]
        );
    }

    private static function upsertGame(int $uid, string $gameId, int $score): void
    {
        Database::run(
            'INSERT INTO game_scores (user_id, game_id, best_score) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE best_score = GREATEST(best_score, VALUES(best_score))',
            [$uid, $gameId, $score]
        );
    }

    /** @param array<string, array{0:int,1:int,2:int,3:int}> $stats */
    private static function addKeyStats(int $uid, array $stats): void
    {
        foreach ($stats as $ch => [$a, $er, $lt, $lc]) {
            Database::run(
                'INSERT INTO key_stats (user_id, key_char, attempts, errors, latency_total, latency_count, avg_latency_ms)
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE attempts = attempts + VALUES(attempts), errors = errors + VALUES(errors),
                   latency_total = latency_total + VALUES(latency_total), latency_count = latency_count + VALUES(latency_count),
                   avg_latency_ms = IF(latency_count > 0, ROUND(latency_total / latency_count), 0)',
                [$uid, $ch, $a, $er, $lt, $lc, $lc > 0 ? (int) round($lt / $lc) : 0]
            );
        }
    }

    private static function addBadges(int $uid, array $ids, string $at): void
    {
        foreach ($ids as $id) {
            Database::run('INSERT IGNORE INTO badges (user_id, badge_id, earned_at) VALUES (?, ?, ?)', [$uid, $id, $at]);
        }
    }

    public static function addSkippedPublic(int $uid, array $ids): void
    {
        $clean = array_values(array_filter(array_map([Validator::class, 'slug'], array_slice($ids, 0, 100))));
        Database::transaction(static fn () => self::addSkipped($uid, $clean));
    }

    private static function addSkipped(int $uid, array $ids): void
    {
        if (!$ids) {
            return;
        }
        $row = Database::one('SELECT skipped_json FROM users WHERE id = ? FOR UPDATE', [$uid]);
        $set = json_decode((string) ($row['skipped_json'] ?? ''), true) ?: [];
        foreach ($ids as $id) {
            $set[$id] = true;
        }
        Database::run('UPDATE users SET skipped_json = ? WHERE id = ?', [json_encode(array_slice($set, 0, 500, true)), $uid]);
    }

    /** Same rule as the browser: consecutive local days. */
    public static function nextStreak(int $current, int $best, ?string $lastDay, string $day): array
    {
        if ($lastDay === $day) {
            return [$current, $best, $lastDay];
        }
        if ($lastDay !== null && $day < $lastDay) {
            return [$current, $best, $lastDay]; // old event arriving late
        }
        $gap = $lastDay === null ? null : (int) round((strtotime($day . ' 00:00:00 UTC') - strtotime($lastDay . ' 00:00:00 UTC')) / 86400);
        $current = $gap === 1 ? $current + 1 : 1;
        return [$current, max($best, $current), $day];
    }

    private static function bumpStreak(int $uid, string $day): void
    {
        $u = Database::one('SELECT streak_current, streak_best, streak_last_day FROM users WHERE id = ? FOR UPDATE', [$uid]);
        [$c, $b, $d] = self::nextStreak((int) $u['streak_current'], (int) $u['streak_best'], $u['streak_last_day'], $day);
        Database::run('UPDATE users SET streak_current = ?, streak_best = ?, streak_last_day = ? WHERE id = ?', [$c, $b, $d, $uid]);
    }

    public static function saveSettings(int $uid, array $settings): void
    {
        $clean = [];
        foreach (self::SETTINGS_KEYS as $k) {
            if (!array_key_exists($k, $settings)) {
                continue;
            }
            $v = $settings[$k];
            $ok = match ($k) {
                'theme' => in_array($v, ['system', 'light', 'dark'], true),
                'fontSize' => in_array($v, ['small', 'normal', 'large', 'xlarge'], true),
                'layout' => $v === null || in_array($v, ['uk', 'us'], true),
                default => is_bool($v),
            };
            if ($ok) {
                $clean[$k] = $v;
            }
        }
        Database::run('UPDATE users SET settings_json = ? WHERE id = ?', [json_encode($clean), $uid]);
    }

    /* ----------------------------------------------------------- guest merge */

    /**
     * Merge a guest's local data into the account: best per lesson, sum XP, union badges,
     * add key stats, keep the better streak. Idempotent per mergeId.
     */
    public static function mergeGuest(int $uid, array $g, string $mergeId): bool
    {
        return Database::transaction(function () use ($uid, $g, $mergeId) {
            if (Database::run('INSERT IGNORE INTO guest_merges (user_id, merge_id) VALUES (?, ?)', [$uid, $mergeId]) === 0) {
                return false; // already merged
            }
            foreach (array_slice((array) ($g['progress'] ?? []), 0, 500, true) as $lessonId => $p) {
                if (!Validator::slug((string) $lessonId) || !is_array($p)) {
                    continue;
                }
                $stars = (int) (Validator::number($p['stars'] ?? 0, 0, 3) ?? 0);
                $wpm = Validator::number($p['bestWpm'] ?? 0, 0, self::MAX_WPM) ?? 0;
                $acc = Validator::number($p['bestAccuracy'] ?? 0, 0, 100) ?? 0;
                $attempts = (int) (Validator::number($p['attempts'] ?? 0, 0, 100000) ?? 0);
                $completed = $stars > 0 ? (Validator::dateTime($p['completedAt'] ?? null) ?? gmdate('Y-m-d H:i:s')) : null;
                self::upsertLesson($uid, (string) $lessonId, $stars, (float) $wpm, (float) $acc, $attempts, $completed);
            }
            foreach (array_slice((array) ($g['results'] ?? []), -300) as $r) {
                if (!is_array($r)) {
                    continue;
                }
                $r['id'] = 'g' . substr(hash('sha256', json_encode([$r['type'] ?? '', $r['ref'] ?? '', $r['at'] ?? '', $r['wpm'] ?? 0])), 0, 40);
                $r['day'] = substr((string) ($r['at'] ?? ''), 0, 10);
                $r['xp'] = 0;
                [$e] = self::validateEvent($r);
                if ($e) {
                    Database::run(
                        'INSERT IGNORE INTO results (user_id, client_id, type, ref_id, wpm, raw_wpm, accuracy, duration_ms, chars, stars, score, created_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [$uid, $e['id'], $e['type'], $e['ref'], $e['wpm'], $e['rawWpm'], $e['accuracy'], $e['durationMs'], $e['chars'], $e['stars'], $e['score'], $e['at']]
                    );
                }
            }
            [$clean] = self::validateEvent([
                'id' => 'merge-' . $mergeId, 'type' => 'practice', 'at' => gmdate('c'), 'day' => gmdate('Y-m-d'),
                'keyStats' => $g['keyStats'] ?? [], 'badges' => array_keys((array) ($g['badges'] ?? [])),
                'skipped' => array_keys(array_filter((array) ($g['skipped'] ?? []))),
            ]);
            if ($clean) {
                self::addKeyStats($uid, $clean['keyStats']);
                foreach ($clean['badges'] as $id) {
                    $at = Validator::dateTime($g['badges'][$id] ?? null) ?? gmdate('Y-m-d H:i:s');
                    Database::run('INSERT IGNORE INTO badges (user_id, badge_id, earned_at) VALUES (?, ?, ?)', [$uid, $id, $at]);
                }
                self::addSkipped($uid, $clean['skipped']);
            }
            foreach (array_slice((array) ($g['gameScores'] ?? []), 0, 50, true) as $game => $score) {
                $s = Validator::number($score, 0, 10000000);
                if (Validator::slug((string) $game) && $s !== null) {
                    self::upsertGame($uid, (string) $game, (int) $s);
                }
            }
            $xp = (int) (Validator::number($g['xp'] ?? 0, 0, 1000000) ?? 0);
            $u = Database::one('SELECT streak_current, streak_best, streak_last_day, settings_json FROM users WHERE id = ? FOR UPDATE', [$uid]);
            $gs = (array) ($g['streak'] ?? []);
            $gDay = Validator::day($gs['lastDay'] ?? null);
            $gCur = (int) (Validator::number($gs['current'] ?? 0, 0, 10000) ?? 0);
            $gBest = (int) (Validator::number($gs['best'] ?? 0, 0, 10000) ?? 0);
            $cur = (int) $u['streak_current'];
            $day = $u['streak_last_day'];
            if ($gDay !== null && ($day === null || $gDay > $day)) {
                [$cur, $day] = [$gCur, $gDay];
            } elseif ($gDay !== null && $gDay === $day) {
                $cur = max($cur, $gCur);
            }
            Database::run(
                'UPDATE users SET xp = LEAST(xp + ?, 4000000000), streak_current = ?, streak_best = GREATEST(streak_best, ?, ?), streak_last_day = ? WHERE id = ?',
                [$xp, $cur, $gBest, $cur, $day, $uid]
            );
            if (empty(json_decode((string) ($u['settings_json'] ?? ''), true)) && is_array($g['settings'] ?? null)) {
                self::saveSettings($uid, $g['settings']);
            }
            return true;
        });
    }

    /* ----------------------------------------------------------------- read */

    /** The account's state in the same shape as the browser store. */
    public static function state(int $uid): array
    {
        $u = Database::one('SELECT * FROM users WHERE id = ?', [$uid]);
        $progress = [];
        foreach (Database::all('SELECT * FROM lesson_progress WHERE user_id = ?', [$uid]) as $r) {
            $progress[$r['lesson_id']] = [
                'stars' => (int) $r['stars'], 'bestWpm' => (float) $r['best_wpm'], 'bestAccuracy' => (float) $r['best_accuracy'],
                'attempts' => (int) $r['attempts'], 'completedAt' => self::iso($r['completed_at']), 'updatedAt' => self::iso($r['updated_at']),
            ];
        }
        $results = array_reverse(array_map(static fn ($r) => [
            'id' => $r['client_id'], 'type' => $r['type'], 'ref' => $r['ref_id'], 'wpm' => (float) $r['wpm'],
            'rawWpm' => (float) $r['raw_wpm'], 'accuracy' => (float) $r['accuracy'], 'durationMs' => (int) $r['duration_ms'],
            'chars' => (int) $r['chars'], 'stars' => (int) $r['stars'], 'score' => (int) $r['score'], 'at' => self::iso($r['created_at']),
        ], Database::all('SELECT * FROM results WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 300', [$uid])));
        $keyStats = [];
        foreach (Database::all('SELECT * FROM key_stats WHERE user_id = ?', [$uid]) as $r) {
            $keyStats[$r['key_char']] = ['attempts' => (int) $r['attempts'], 'errors' => (int) $r['errors'],
                'latencyTotal' => (int) $r['latency_total'], 'latencyCount' => (int) $r['latency_count']];
        }
        $badges = [];
        foreach (Database::all('SELECT badge_id, earned_at FROM badges WHERE user_id = ?', [$uid]) as $r) {
            $badges[$r['badge_id']] = self::iso($r['earned_at']);
        }
        $games = [];
        foreach (Database::all('SELECT game_id, best_score FROM game_scores WHERE user_id = ?', [$uid]) as $r) {
            $games[$r['game_id']] = (int) $r['best_score'];
        }
        return [
            'progress' => $progress ?: new \stdClass(),
            'results' => $results,
            'keyStats' => $keyStats ?: new \stdClass(),
            'badges' => $badges ?: new \stdClass(),
            'gameScores' => $games ?: new \stdClass(),
            'skipped' => (json_decode((string) ($u['skipped_json'] ?? ''), true) ?: new \stdClass()),
            'settings' => (json_decode((string) ($u['settings_json'] ?? ''), true) ?: new \stdClass()),
            'xp' => (int) $u['xp'],
            'streak' => ['current' => (int) $u['streak_current'], 'best' => (int) $u['streak_best'], 'lastDay' => $u['streak_last_day']],
        ];
    }

    private static function iso(?string $dt): ?string
    {
        return $dt === null ? null : gmdate('Y-m-d\TH:i:s\Z', (int) strtotime($dt . ' UTC'));
    }
}
