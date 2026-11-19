<?php
/** @var string $title @var int $phase @var string $blurb */
?>
<section class="container page-narrow empty-state">
    <?= \App\Core\View::render('partials/mascot', ['size' => 130, 'mood' => 'think']) ?>
    <h1><?= e($title) ?></h1>
    <p class="lead"><?= e($blurb) ?></p>
    <p class="text-muted">Pip is still building this bit (planned for phase <?= (int) $phase ?>). Check back soon!</p>
    <a class="btn btn--primary" href="<?= e(url('/')) ?>">Back to home</a>
</section>
