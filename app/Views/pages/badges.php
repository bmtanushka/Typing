<?php /** @var array $badges */ ?>
<div class="container trophy">
    <header class="trophy__intro">
        <div>
            <p class="eyebrow">Your achievements</p>
            <h1>Badges</h1>
            <p class="lead">Earn badges for finishing lessons, building streaks, typing accurately and getting faster.</p>
        </div>
        <div class="trophy__summary card">
            <div class="summary-stat"><span class="summary-stat__icon summary-stat__icon--level" data-icon="star"></span><div><p class="summary-stat__value" data-level>Level 1</p><div class="progress progress--xp" role="progressbar" aria-label="XP towards the next level" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-level-progress><span class="progress__bar"></span></div><p class="small text-muted" data-level-text>0 / 100 XP</p></div></div>
            <div class="summary-stat"><span class="summary-stat__icon summary-stat__icon--streak" data-icon="flame"></span><div><p class="summary-stat__value" data-streak>0 days</p><p class="small text-muted" data-streak-best>Best: 0 days</p></div></div>
            <div class="summary-stat"><span class="summary-stat__icon summary-stat__icon--badges" data-icon="medal"></span><div><p class="summary-stat__value"><span data-earned-count>0</span> / <?= count($badges) ?></p><p class="small text-muted">badges earned</p></div></div>
        </div>
    </header>

    <?= \App\Core\View::render('partials/guest-banner') ?>

    <ul class="badge-grid">
        <?php foreach ($badges as $b): ?>
            <li class="badge-card badge-card--locked badge-card--<?= e($b['colour'] ?? 'primary') ?>" data-badge="<?= e($b['id']) ?>">
                <span class="badge-card__medal" data-icon="<?= e($b['icon']) ?>"></span>
                <h2 class="badge-card__title"><?= e($b['title']) ?></h2>
                <p class="badge-card__desc"><?= e($b['description']) ?></p>
                <p class="badge-card__state small" data-badge-state>Not earned yet</p>
            </li>
        <?php endforeach; ?>
    </ul>
</div>
