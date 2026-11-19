<footer class="site-footer">
    <div class="container site-footer__inner">
        <p>&copy; <?= e(date('Y')) ?> <?= e(config('app.name')) ?> · Learn to type, one key at a time.</p>
        <nav aria-label="Footer">
            <ul class="site-footer__links">
                <li><a href="<?= e(url('/demo')) ?>">Playground</a></li>
                <li><a href="<?= e(url('/help')) ?>">Help</a></li>
                <li><a href="<?= e(url('/privacy')) ?>">Privacy</a></li>
                <li><a href="<?= e(url('/settings')) ?>">Settings</a></li>
                <?php if (\App\Core\Config::isDev()): ?>
                    <li><a href="<?= e(url('/styleguide')) ?>">Style guide</a></li>
                <?php endif; ?>
            </ul>
        </nav>
    </div>
</footer>
