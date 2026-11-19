<header class="site-header">
    <div class="container site-header__inner">
        <a class="brand" href="<?= e(url('/')) ?>" aria-label="<?= e(config('app.name')) ?> – home">
            <?= \App\Core\View::render('partials/logo') ?>
            <span class="brand__name"><?= e(config('app.name')) ?></span>
        </a>

        <button class="nav-toggle btn btn--ghost btn--icon" type="button"
                aria-expanded="false" aria-controls="site-nav" data-nav-toggle>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
            <span class="visually-hidden">Menu</span>
        </button>

        <nav id="site-nav" class="site-nav" aria-label="Main">
            <ul class="site-nav__list">
                <?php foreach (nav_items() as $item): ?>
                    <li>
                        <a class="site-nav__link" href="<?= e(url($item['path'])) ?>"
                           <?= is_active($item['path']) ? 'aria-current="page"' : '' ?>><?= e($item['label']) ?></a>
                    </li>
                <?php endforeach; ?>
            </ul>
            <div class="site-nav__actions">
                <a class="header-stats" href="<?= e(url('/badges')) ?>" data-header-stats hidden></a>
                <button class="btn btn--ghost btn--icon theme-toggle" type="button" data-theme-toggle
                        aria-label="Change theme">
                    <svg class="theme-toggle__icon theme-toggle__icon--light" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
                    <svg class="theme-toggle__icon theme-toggle__icon--dark" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
                    <svg class="theme-toggle__icon theme-toggle__icon--system" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>
                </button>
                <a class="btn btn--secondary btn--sm" href="<?= e(url('/login')) ?>">Log in</a>
            </div>
        </nav>
    </div>
</header>
