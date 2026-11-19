<?php /** @var ?\Throwable $error Only set in debug mode */ ?>
<section class="container page-narrow empty-state">
    <?= \App\Core\View::render('partials/mascot', ['size' => 130, 'mood' => 'think']) ?>
    <p class="eyebrow">Error 500</p>
    <h1>Sorry, something went wrong</h1>
    <p class="lead">It’s not you, it’s us. Please try again in a moment. Your saved progress is safe.</p>
    <a class="btn btn--primary" href="<?= e(url('/')) ?>">Go to home</a>
    <?php if (!empty($error)): ?>
        <details class="card debug-details" open>
            <summary><?= e($error::class) ?>: <?= e($error->getMessage()) ?></summary>
            <pre><?= e($error->getFile() . ':' . $error->getLine() . "\n\n" . $error->getTraceAsString()) ?></pre>
        </details>
    <?php endif; ?>
</section>
