<?php use App\Core\View; ?>
<div class="container practice">
    <section class="card placement-intro" data-placement-intro>
        <?= View::render('partials/mascot', ['size' => 100, 'mood' => 'happy']) ?>
        <div>
            <p class="eyebrow">Placement test</p>
            <h1>Already a confident typist?</h1>
            <p class="lead">Type for one minute and Pip will suggest which lessons you can skip. You can still play any skipped lesson later.</p>
            <ul class="placement-intro__points">
                <li>Use all your fingers and keep your eyes on the screen.</li>
                <li>Accuracy matters most – we need at least 90% to recommend skipping.</li>
                <li>The minute starts when you press your first key.</li>
            </ul>
            <div class="cluster">
                <button class="btn btn--primary btn--lg" type="button" data-placement-start>Start the 1-minute test</button>
                <a class="btn btn--ghost" href="<?= e(url('/lessons/gs-welcome')) ?>">I’d rather start from the beginning</a>
            </div>
        </div>
    </section>

    <?= View::render('partials/exercise') ?>

    <section class="card placement-result" data-placement-result hidden tabindex="-1" aria-labelledby="pl-res-title">
        <div class="practice__results-head">
            <?= View::render('partials/mascot', ['size' => 72, 'mood' => 'cheer']) ?>
            <div>
                <h2 id="pl-res-title" data-pl-title>Here’s what we suggest</h2>
                <p class="lead" data-pl-summary></p>
            </div>
        </div>
        <ul class="placement-units" data-pl-units></ul>
        <div class="cluster">
            <button class="btn btn--primary btn--lg" type="button" data-pl-apply hidden>Skip these and start</button>
            <a class="btn btn--secondary" href="<?= e(url('/lessons/gs-welcome')) ?>" data-pl-begin>Start from the beginning</a>
            <button class="btn btn--ghost" type="button" data-pl-retry>Try the test again</button>
        </div>
    </section>
</div>
