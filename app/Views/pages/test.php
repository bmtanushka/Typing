<?php use App\Core\View; ?>
<div class="container practice">
    <header class="practice__intro">
        <div>
            <p class="eyebrow">Typing test</p>
            <h1>How fast can you type?</h1>
            <p class="lead">Type a short passage for one, three or five minutes. Accuracy counts – mistakes lower your speed.</p>
        </div>
        <?= View::render('partials/mascot', ['size' => 80, 'mood' => 'think']) ?>
    </header>

    <section class="card test-setup" data-test-setup aria-labelledby="test-choose">
        <h2 id="test-choose">Choose a length</h2>
        <div class="test-setup__options">
            <?php foreach ([1 => 'A quick check', 3 => 'The standard test', 5 => 'A stamina challenge'] as $m => $d): ?>
                <button class="test-option" type="button" data-minutes="<?= $m ?>">
                    <span class="test-option__time"><?= $m ?> <span><?= $m === 1 ? 'minute' : 'minutes' ?></span></span>
                    <span class="test-option__desc"><?= e($d) ?></span>
                </button>
            <?php endforeach; ?>
        </div>
        <p class="small text-muted">The timer starts when you press your first key. Your best result: <strong data-best>no tests yet</strong>.</p>
    </section>

    <?= View::render('partials/exercise') ?>

    <section class="card practice__results" data-results hidden tabindex="-1" aria-labelledby="test-res-title">
        <div class="practice__results-head">
            <?= View::render('partials/mascot', ['size' => 72, 'mood' => 'cheer']) ?>
            <div>
                <h2 id="test-res-title" data-results-title>Test complete!</h2>
                <p class="text-muted" data-results-message></p>
            </div>
            <span class="rewards__xp" data-results-xp></span>
        </div>
        <div class="results__stats">
            <div class="stat"><p class="stat__label">Speed</p><p class="stat__value"><span data-r="wpm"></span><span> WPM</span></p></div>
            <div class="stat"><p class="stat__label">Accuracy</p><p class="stat__value"><span data-r="accuracy"></span><span>%</span></p></div>
            <div class="stat"><p class="stat__label">Raw speed</p><p class="stat__value"><span data-r="rawWpm"></span><span> WPM</span></p></div>
            <div class="stat"><p class="stat__label">Errors</p><p class="stat__value"><span data-r="errors"></span></p></div>
        </div>
        <ul class="cluster" data-results-problem></ul>
        <div class="cluster">
            <button class="btn btn--primary" type="button" data-again>Take another test</button>
            <a class="btn btn--ghost" href="<?= e(url('/practice')) ?>?mode=problem">Practise problem keys</a>
        </div>
    </section>

    <section class="card test-history" aria-labelledby="test-hist-title">
        <h2 id="test-hist-title">Your test history (WPM)</h2>
        <div data-history></div>
    </section>
</div>
