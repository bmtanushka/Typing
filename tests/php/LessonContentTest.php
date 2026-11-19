<?php
declare(strict_types=1);

use App\Services\LessonRepository;

$repo = new LessonRepository(KQ_ROOT . '/content/lessons');

/** Characters available in each lesson: all newKeys so far + space. */
$allowedByLesson = (function () use ($repo): array {
    $set = [' ' => true];
    $out = [];
    foreach ($repo->order() as $l) {
        foreach ($l['newKeys'] as $k) {
            $set[$k] = true;
        }
        $out[$l['id']] = $set;
    }
    return $out;
})();

return [
    'every lesson in units.json exists and ids match file names' => function () use ($repo) {
        $raw = json_decode((string) file_get_contents(KQ_ROOT . '/content/lessons/units.json'), true);
        foreach ($raw['units'] as $u) {
            foreach ($u['lessons'] as $id) {
                $l = $repo->lesson($id);
                assert_true($l !== null, "missing lesson {$id}");
                assert_same($id, $l['id']);
                assert_same($u['id'], $l['unit'], "unit of {$id}");
            }
        }
    },
    'lessons have required fields and known step types' => function () use ($repo) {
        $types = ['info', 'keys', 'drill', 'words', 'challenge'];
        foreach ($repo->order() as $s) {
            $l = $repo->lesson($s['id']);
            foreach (['id', 'unit', 'title', 'newKeys', 'intro', 'steps', 'passCriteria', 'estimatedMinutes'] as $k) {
                assert_true(array_key_exists($k, $l), "{$s['id']} lacks {$k}");
            }
            assert_true(count($l['steps']) >= 2, "{$s['id']} needs steps");
            foreach ($l['steps'] as $i => $step) {
                assert_true(in_array($step['type'], $types, true), "{$s['id']} step {$i} type");
                assert_true(!empty($step['title']), "{$s['id']} step {$i} title");
            }
        }
    },
    'unit 2 texts only use keys learnt so far' => function () use ($repo, $allowedByLesson) {
        foreach ($repo->order() as $s) {
            if ($s['unit'] !== 'home-row') {
                continue;
            }
            $allowed = $allowedByLesson[$s['id']];
            foreach ($repo->lesson($s['id'])['steps'] as $i => $step) {
                foreach ((array) ($step['text'] ?? []) as $text) {
                    foreach (mb_str_split($text) as $ch) {
                        assert_true(isset($allowed[$ch]), "{$s['id']} step {$i}: '{$ch}' not learnt yet");
                    }
                }
            }
        }
    },
    'invalid ids are rejected' => function () use ($repo) {
        assert_same(null, $repo->lesson('../config'));
        assert_same(null, $repo->lesson('nope'));
        assert_same(false, LessonRepository::isValidId('Hr-FJ'));
    },
];
