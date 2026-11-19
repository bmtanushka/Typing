<?php
declare(strict_types=1);

use App\Services\ProgressService;
use App\Services\Validator;

$event = static fn (array $o = []): array => $o + [
    'id' => 'abcdef123456', 'type' => 'lesson', 'ref' => 'hr-fj', 'at' => gmdate('c'), 'day' => gmdate('Y-m-d'),
    'wpm' => 20, 'rawWpm' => 22, 'accuracy' => 95.5, 'durationMs' => 30000, 'chars' => 60, 'stars' => 2, 'xp' => 30,
    'keyStats' => ['f' => ['attempts' => 5, 'errors' => 1, 'latencyTotal' => 900, 'latencyCount' => 4]],
    'badges' => ['first-steps', 'not-a-badge'], 'skipped' => ['gs-welcome', '../x'],
];

return [
    'a sensible event is accepted and normalised' => function () use ($event) {
        [$e, $why] = ProgressService::validateEvent($event());
        assert_same(null, $why);
        assert_same(['first-steps'], $e['badges'], 'unknown badges dropped');
        assert_same(['gs-welcome'], $e['skipped'], 'bad slugs dropped');
        assert_same([5, 1, 900, 4], $e['keyStats']['f']);
    },
    'implausible events are rejected' => function () use ($event) {
        foreach ([
            ['wpm' => 251], ['rawWpm' => 400], ['accuracy' => 101], ['stars' => 4], ['xp' => 5000],
            ['chars' => 2000, 'durationMs' => 10000], ['type' => 'hack'], ['ref' => 'Bad Ref'],
            ['id' => 'x'], ['at' => 'yesterday-ish'], ['day' => '2026-02-30'], ['at' => gmdate('c', time() + 3 * 86400)],
        ] as $bad) {
            [$e] = ProgressService::validateEvent($event($bad));
            assert_same(null, $e, 'should reject ' . json_encode($bad));
        }
    },
    'key stats with more errors than attempts are ignored' => function () use ($event) {
        [$e] = ProgressService::validateEvent($event(['keyStats' => ['d' => ['attempts' => 1, 'errors' => 5, 'latencyTotal' => 0, 'latencyCount' => 0]]]));
        assert_same([], $e['keyStats']);
    },
    'server streak follows the same rules as the browser' => function () {
        assert_same([1, 1, '2026-01-31'], ProgressService::nextStreak(0, 0, null, '2026-01-31'));
        assert_same([3, 3, '2026-02-01'], ProgressService::nextStreak(2, 2, '2026-01-31', '2026-02-01'));
        assert_same([2, 2, '2026-02-01'], ProgressService::nextStreak(2, 2, '2026-02-01', '2026-02-01'));
        assert_same([1, 5, '2026-02-04'], ProgressService::nextStreak(2, 5, '2026-02-01', '2026-02-04'));
        assert_same([2, 2, '2026-02-01'], ProgressService::nextStreak(2, 2, '2026-02-01', '2026-01-20'), 'late events ignored');
    },
    'validators' => function () {
        assert_same('sam@example.com', Validator::email('  SAM@Example.com '));
        assert_same(null, Validator::email('sam@'));
        assert_same(null, Validator::password('short'));
        assert_same('Sam Smith', Validator::displayName("  Sam \u{0007} \n Smith "));
        assert_same(null, Validator::displayName(str_repeat('a', 41)));
        assert_same(null, Validator::slug('Hr-FJ'));
    },
];
