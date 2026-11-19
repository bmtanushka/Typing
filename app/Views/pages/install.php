<?php /** @var array $status @var string $csrf */ ?>
<div class="container auth">
    <section class="auth__card card">
        <h1>Install <?= e(config('app.name')) ?></h1>
        <ul class="install-checks">
            <li class="<?= $status['configured'] ? 'is-ok' : 'is-bad' ?>">Database settings in config.php <?= $status['configured'] ? 'found' : 'missing' ?></li>
            <li class="<?= $status['connected'] ? 'is-ok' : 'is-bad' ?>">Database connection <?= $status['connected'] ? 'working' : 'not working' ?></li>
            <li class="<?= $status['installed'] ? 'is-ok' : '' ?>">Tables <?= $status['installed'] ? 'already created' : 'not created yet' ?></li>
        </ul>
        <?php if ($status['error']): ?><p class="alert alert--danger"><?= e($status['error']) ?></p><?php endif; ?>
        <?php if ($status['connected']): ?>
            <p>Click below to create or update the tables. Afterwards this page locks itself (delete <code>storage/installed.lock</code> to run it again).</p>
            <div class="alert alert--success" role="status" data-install-result hidden></div>
            <button class="btn btn--primary" type="button" data-install data-csrf="<?= e($csrf) ?>">Create tables</button>
        <?php endif; ?>
    </section>
</div>
