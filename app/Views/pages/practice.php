<?php use App\Core\View; /** @var string $mode */ ?>
<div class="container practice">
    <header class="practice__intro">
        <div>
            <p class="eyebrow">Practice</p>
            <h1>Practise your way</h1>
            <p class="lead">Work on the keys you find tricky, warm up with word sets or type your own text.</p>
        </div>
        <?= View::render('partials/mascot', ['size' => 80, 'mood' => 'happy']) ?>
    </header>

    <form class="practice__controls card" data-practice-form aria-label="Practice options">
        <fieldset class="practice__modes">
            <legend class="field__label">What would you like to practise?</legend>
            <div class="segmented">
                <?php foreach (['problem' => 'Problem keys', 'words' => 'Word sets', 'own' => 'Your own text'] as $v => $l): ?>
                    <label class="segmented__option"><input type="radio" name="mode" value="<?= $v ?>" <?= $mode === $v ? 'checked' : '' ?>><span><?= $l ?></span></label>
                <?php endforeach; ?>
            </div>
        </fieldset>
        <div class="field" data-for-mode="words">
            <label class="field__label" for="pr-set">Word set</label>
            <select class="input" id="pr-set" name="set">
                <option value="learnt">Words with the keys I’ve learnt</option>
                <option value="common">Common words</option>
                <option value="sentences">Sentences</option>
                <option value="paragraphs">Short paragraphs</option>
            </select>
        </div>
        <div class="field">
            <label class="field__label" for="pr-time">Time</label>
            <select class="input" id="pr-time" name="time">
                <option value="0">Until the end</option>
                <option value="60">1 minute</option>
                <option value="120">2 minutes</option>
            </select>
        </div>
        <div class="field practice__own" data-for-mode="own">
            <label class="field__label" for="pr-own">Your text</label>
            <textarea class="input" id="pr-own" name="own" rows="4" maxlength="3000" placeholder="Paste or type anything you like – a poem, notes or a favourite passage."></textarea>
            <button class="btn btn--secondary btn--sm" type="button" data-use-own>Practise this text</button>
        </div>
        <p class="practice__note small text-muted" data-problem-note hidden></p>
    </form>

    <?= View::render('partials/exercise') ?>

    <section class="card practice__results" data-results hidden tabindex="-1" aria-labelledby="pr-res-title">
        <div class="practice__results-head">
            <?= View::render('partials/mascot', ['size' => 72, 'mood' => 'cheer']) ?>
            <div>
                <h2 id="pr-res-title" data-results-title>Nice practice!</h2>
                <p class="text-muted" data-results-message></p>
            </div>
            <span class="rewards__xp" data-results-xp></span>
        </div>
        <div class="results__stats">
            <div class="stat"><p class="stat__label">Speed</p><p class="stat__value"><span data-r="wpm"></span><span> WPM</span></p></div>
            <div class="stat"><p class="stat__label">Accuracy</p><p class="stat__value"><span data-r="accuracy"></span><span>%</span></p></div>
            <div class="stat"><p class="stat__label">Time</p><p class="stat__value"><span data-r="time"></span></p></div>
            <div class="stat"><p class="stat__label">Errors</p><p class="stat__value"><span data-r="errors"></span></p></div>
        </div>
        <ul class="cluster" data-results-problem></ul>
        <div class="cluster">
            <button class="btn btn--primary" type="button" data-again>Practise again</button>
            <a class="btn btn--ghost" href="<?= e(url('/progress')) ?>">See my progress</a>
        </div>
    </section>
</div>
