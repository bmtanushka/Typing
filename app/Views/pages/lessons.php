<?php
/** @var array $course ['units' => [...]] */
use App\Core\View;

$upcoming = [
    ['Top row', 'E I R U T Y W O Q P'],
    ['Bottom row', 'C , V M X . Z / B N'],
    ['Capitals and Shift', 'Left and right Shift'],
    ['Punctuation', '\' " ? ! : - ( )'],
    ['Numbers', '1 2 3 4 5 6 7 8 9 0'],
    ['Symbols', '@ £ $ % & * and friends'],
    ['Real-world practice', 'Sentences, stories and emails'],
    ['Speed building', 'Timed paragraphs'],
];
$unitNo = 0;
$keyLabel = static fn (array $keys): string => implode(' ', array_map(static fn ($k) => mb_strtoupper($k), $keys));
?>
<div class="container journey">
    <header class="journey__intro">
        <div>
            <p class="eyebrow">Your typing journey</p>
            <h1>Lessons</h1>
            <p class="lead">Short, friendly lessons – one or two new keys at a time. Earn up to three stars in each.</p>
        </div>
        <div class="journey__continue card card--tinted" data-continue hidden>
            <?= View::render('partials/mascot', ['size' => 64, 'mood' => 'happy']) ?>
            <div>
                <p class="small text-muted journey__continue-label" data-continue-label>Up next</p>
                <p class="journey__continue-title" data-continue-title></p>
            </div>
            <a class="btn btn--primary" href="#" data-continue-link>Continue</a>
        </div>
    </header>

    <?= View::render('partials/guest-banner') ?>
    <p class="visually-hidden" role="status" data-map-status></p>

    <?php foreach ($course['units'] as $unit): $unitNo++; ?>
        <section class="island island--<?= e($unit['colour'] ?? 'primary') ?>" id="unit-<?= e($unit['id']) ?>"
                 aria-labelledby="unit-title-<?= e($unit['id']) ?>" data-unit="<?= e($unit['id']) ?>">
            <header class="island__head">
                <span class="island__num" aria-hidden="true"><?= $unitNo ?></span>
                <div>
                    <h2 class="island__title" id="unit-title-<?= e($unit['id']) ?>">
                        <span class="visually-hidden">Unit <?= $unitNo ?>: </span><?= e($unit['title']) ?>
                    </h2>
                    <p class="island__desc"><?= e($unit['description'] ?? '') ?></p>
                </div>
                <div class="island__side">
                    <p class="island__progress" data-unit-progress>
                        <span data-unit-done>0</span> / <?= count($unit['lessons']) ?> done
                    </p>
                    <div class="island__actions" data-unit-actions></div>
                </div>
            </header>
            <ol class="path">
                <?php foreach ($unit['lessons'] as $i => $l):
                    $type = $l['type'] ?? 'lesson';
                    $keys = $keyLabel($l['newKeys']);
                    ?>
                    <li class="path__step">
                        <a class="map-node map-node--todo map-node--<?= e($type) ?>" href="<?= e(url('/lessons/' . $l['id'])) ?>"
                           data-lesson="<?= e($l['id']) ?>">
                            <span class="map-node__disc" aria-hidden="true">
                                <?php if ($type === 'checkpoint'): ?>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>
                                <?php elseif ($keys !== ''): ?>
                                    <?= e($keys) ?>
                                <?php else: ?>
                                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/></svg>
                                <?php endif; ?>
                            </span>
                            <span class="map-node__label"><?= e($l['title']) ?></span>
                            <span class="map-node__meta small text-muted"><?= (int) $l['estimatedMinutes'] ?> min<span class="visually-hidden" data-sr-state>, not started</span></span>
                            <span class="map-node__stars" aria-hidden="true" data-stars></span>
                            <span class="map-node__lock" aria-hidden="true" data-icon="lock"></span>
                        </a>
                    </li>
                <?php endforeach; ?>
            </ol>
        </section>
    <?php endforeach; ?>

    <dialog class="dialog" data-locked-dialog aria-labelledby="locked-title">
        <form method="dialog" class="stack">
            <div class="dialog__head">
                <?= View::render('partials/mascot', ['size' => 64, 'mood' => 'think']) ?>
                <h2 id="locked-title">This lesson is still locked</h2>
            </div>
            <p data-locked-text></p>
            <div class="cluster">
                <a class="btn btn--primary" href="#" data-locked-go>Go to lesson</a>
                <a class="btn btn--secondary" href="#" data-locked-test hidden>Test out with the checkpoint</a>
                <button class="btn btn--ghost" value="close">Close</button>
            </div>
        </form>
    </dialog>

    <h2 class="journey__soon-title">Coming next on your journey</h2>
    <div class="islands-soon">
    <?php foreach ($upcoming as [$title, $desc]): $unitNo++; ?>
        <section class="island island--soon" aria-label="Unit <?= $unitNo ?>: <?= e($title) ?> (coming soon)">
            <header class="island__head">
                <span class="island__num" aria-hidden="true"><?= $unitNo ?></span>
                <div>
                    <h3 class="island__title"><?= e($title) ?></h3>
                    <p class="island__desc"><?= e($desc) ?></p>
                </div>
                <p class="island__progress"><span class="pill">Coming soon</span></p>
            </header>
        </section>
    <?php endforeach; ?>
    </div>
</div>
