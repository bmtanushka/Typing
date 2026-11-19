<?php
/**
 * Main layout.
 * @var string $content     Rendered page body
 * @var string $title       Page title
 * @var ?string $description
 * @var ?string $bodyClass
 * @var ?string $pageScript Path under assets/ of a page ES module
 * @var ?bool   $noindex
 * @var ?array  $pageStyles Extra stylesheets under assets/
 */
$appName = (string) config('app.name', 'KeyQuest');
?><!doctype html>
<?php $authUser = \App\Services\Auth::user(); ?>
<html lang="en-GB" data-base="<?= e(base_path()) ?>"<?= $authUser ? ' data-user="' . (int) $authUser['id'] . '"' : '' ?>>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= e(isset($title) ? "{$title} · {$appName}" : $appName) ?></title>
    <meta name="description" content="<?= e($description ?? 'Learn to touch type with friendly lessons, games and tests.') ?>">
    <?php if (!empty($noindex)): ?><meta name="robots" content="noindex"><?php endif; ?>
    <meta name="color-scheme" content="light dark">
    <?php if ($authUser): ?><meta name="csrf-token" content="<?= e(\App\Core\Csrf::token()) ?>"><?php endif; ?>
    <meta name="theme-color" content="#4f46e5">
    <link rel="icon" href="<?= e(asset('img/favicon.svg')) ?>" type="image/svg+xml">
    <script src="<?= e(asset('js/theme-init.js')) ?>"></script>
    <link rel="stylesheet" href="<?= e(asset('css/tokens.css')) ?>">
    <link rel="stylesheet" href="<?= e(asset('css/base.css')) ?>">
    <link rel="stylesheet" href="<?= e(asset('css/components.css')) ?>">
    <?php foreach ($pageStyles ?? [] as $sheet): ?>
    <link rel="stylesheet" href="<?= e(asset($sheet)) ?>">
    <?php endforeach; ?>
    <script type="module" src="<?= e(asset('js/app.js')) ?>"></script>
    <?php if (!empty($pageScript)): ?>
    <script type="module" src="<?= e(asset($pageScript)) ?>"></script>
    <?php endif; ?>
</head>
<body class="<?= e($bodyClass ?? '') ?>">
    <a class="skip-link" href="#main">Skip to content</a>
    <?= \App\Core\View::render('partials/header') ?>
    <main id="main" tabindex="-1">
        <?= $content ?>
    </main>
    <?= \App\Core\View::render('partials/footer') ?>
</body>
</html>
