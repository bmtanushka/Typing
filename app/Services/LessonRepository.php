<?php
declare(strict_types=1);

namespace App\Services;

/**
 * Reads the course from content/lessons (units.json + one JSON file per lesson).
 */
final class LessonRepository
{
    private ?array $units = null;
    private array $lessons = [];

    public function __construct(private readonly string $dir = KQ_ROOT . '/content/lessons')
    {
    }

    public static function isValidId(string $id): bool
    {
        return (bool) preg_match('/^[a-z0-9][a-z0-9-]{0,63}$/', $id);
    }

    /** Full lesson definition, or null if it does not exist. */
    public function lesson(string $id): ?array
    {
        if (!self::isValidId($id)) {
            return null;
        }
        if (!array_key_exists($id, $this->lessons)) {
            $file = "{$this->dir}/{$id}.json";
            $this->lessons[$id] = is_file($file) ? json_decode((string) file_get_contents($file), true, 64, JSON_THROW_ON_ERROR) : null;
        }
        return $this->lessons[$id];
    }

    /** Course index: units with lesson summaries, in course order. */
    public function index(): array
    {
        if ($this->units === null) {
            $raw = json_decode((string) file_get_contents("{$this->dir}/units.json"), true, 64, JSON_THROW_ON_ERROR);
            $this->units = array_map(function (array $unit): array {
                $unit['lessons'] = array_values(array_filter(array_map(function (string $id): ?array {
                    $l = $this->lesson($id);
                    return $l === null ? null : [
                        'id' => $l['id'],
                        'title' => $l['title'],
                        'type' => $l['type'] ?? 'lesson',
                        'newKeys' => $l['newKeys'] ?? [],
                        'estimatedMinutes' => $l['estimatedMinutes'] ?? 3,
                        'mapLabel' => $l['mapLabel'] ?? null,
                    ];
                }, $unit['lessons'])));
                return $unit;
            }, $raw['units']);
        }
        return ['units' => $this->units];
    }

    /** Flat list of lesson summaries in course order. */
    public function order(): array
    {
        $out = [];
        foreach ($this->index()['units'] as $unit) {
            foreach ($unit['lessons'] as $l) {
                $out[] = $l + ['unit' => $unit['id'], 'unitTitle' => $unit['title']];
            }
        }
        return $out;
    }

    /** Version hash of all lesson content (for ETags). */
    public function version(): string
    {
        $parts = [];
        foreach (glob("{$this->dir}/*.json") ?: [] as $f) {
            $parts[] = basename($f) . filemtime($f) . filesize($f);
        }
        return md5(implode('|', $parts));
    }
}
