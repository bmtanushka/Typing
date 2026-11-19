<?php use App\Core\View; /** @var array $course */ ?>
<div class="container dash">
    <header class="dash__intro">
        <div>
            <p class="eyebrow">Your progress</p>
            <h1 data-dash-title>How you’re doing</h1>
            <p class="lead" data-dash-sync>Your progress is saved in this browser.</p>
        </div>
        <div class="dash__chips">
            <span class="pill pill--primary" data-dash-level>Level 1</span>
            <span class="pill pill--warning" data-dash-streak>0-day streak</span>
        </div>
    </header>

    <?= View::render('partials/guest-banner') ?>

    <section class="empty-state card dash__empty" data-dash-empty hidden>
        <?= View::render('partials/mascot', ['size' => 110, 'mood' => 'happy']) ?>
        <h2>Nothing here yet – let’s change that!</h2>
        <p class="lead">Finish your first lesson and your speed, accuracy and problem keys will appear here.</p>
        <a class="btn btn--primary btn--lg" href="<?= e(url('/lessons')) ?>">Start a lesson</a>
    </section>

    <div data-dash-content hidden>
        <section class="dash__stats" aria-label="Summary">
            <div class="card stat"><p class="stat__label">Lessons done</p><p class="stat__value" data-s="lessons">0</p><p class="small text-muted" data-s="lessons-sub"></p></div>
            <div class="card stat"><p class="stat__label">Best speed</p><p class="stat__value"><span data-s="best">0</span> <span>WPM</span></p><p class="small text-muted" data-s="best-sub"></p></div>
            <div class="card stat"><p class="stat__label">Recent accuracy</p><p class="stat__value"><span data-s="acc">0</span><span>%</span></p><p class="small text-muted">average of your last 10</p></div>
            <div class="card stat"><p class="stat__label">Time practised</p><p class="stat__value" data-s="time">0 min</p><p class="small text-muted" data-s="sessions"></p></div>
        </section>

        <div class="dash__grid">
            <section class="card dash__chart" aria-labelledby="ch-wpm">
                <h2 id="ch-wpm">Speed (WPM)</h2>
                <div data-chart="wpm"></div>
            </section>
            <section class="card dash__chart" aria-labelledby="ch-acc">
                <h2 id="ch-acc">Accuracy (%)</h2>
                <div data-chart="accuracy"></div>
            </section>
        </div>

        <section class="card dash__heat" aria-labelledby="heat-title">
            <div class="dash__heat-head">
                <div>
                    <h2 id="heat-title">Problem keys</h2>
                    <p class="text-muted">Keys you miss most often are shaded darker.</p>
                </div>
                <ul class="heat-legend" aria-label="Shading key">
                    <li><span class="heat-swatch" data-heat-level="0"></span>Fine</li>
                    <li><span class="heat-swatch" data-heat-level="1"></span>Sometimes</li>
                    <li><span class="heat-swatch" data-heat-level="2"></span>Often</li>
                    <li><span class="heat-swatch" data-heat-level="3"></span>Most often</li>
                </ul>
            </div>
            <div data-dash-keyboard></div>
            <div class="dash__problem">
                <ul class="cluster" data-dash-problem></ul>
                <a class="btn btn--secondary btn--sm" href="<?= e(url('/practice')) ?>?mode=problem" data-dash-practise>Practise these keys</a>
            </div>
            <p class="small text-muted" data-dash-noproblem hidden>No problem keys yet – lovely accurate typing!</p>
        </section>

        <div class="dash__grid">
            <section class="card" aria-labelledby="course-title">
                <h2 id="course-title">Course</h2>
                <ul class="dash__units">
                    <?php foreach ($course['units'] as $u): ?>
                        <li data-dash-unit="<?= e($u['id']) ?>" data-total="<?= count($u['lessons']) ?>">
                            <div class="dash__unit-head"><span><?= e($u['title']) ?></span><span class="small text-muted" data-unit-count>0 / <?= count($u['lessons']) ?></span></div>
                            <div class="progress progress--success" role="progressbar" aria-label="<?= e($u['title']) ?> progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="progress__bar"></span></div>
                        </li>
                    <?php endforeach; ?>
                </ul>
                <a class="btn btn--ghost btn--sm" href="<?= e(url('/lessons')) ?>">Go to lessons</a>
            </section>
            <section class="card" aria-labelledby="recent-title">
                <h2 id="recent-title">Recent activity</h2>
                <ol class="activity" data-dash-recent></ol>
            </section>
        </div>

        <section class="card dash__badges" aria-labelledby="dash-badges">
            <div class="dash__heat-head">
                <h2 id="dash-badges">Badges</h2>
                <a class="btn btn--ghost btn--sm" href="<?= e(url('/badges')) ?>">See all badges</a>
            </div>
            <ul class="dash__badge-row" data-dash-badges></ul>
        </section>
    </div>
</div>
