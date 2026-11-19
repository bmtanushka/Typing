<section class="container page-narrow empty-state">
    <?= \App\Core\View::render('partials/mascot', ['size' => 130, 'mood' => 'think']) ?>
    <p class="eyebrow">Error 404</p>
    <h1>Oops – that key isn’t on our keyboard</h1>
    <p class="lead">We couldn’t find the page you were looking for. It may have moved, or the link might have a typo (it happens to the best typists!).</p>
    <div class="cluster cluster--center">
        <a class="btn btn--primary" href="<?= e(url('/')) ?>">Go to home</a>
        <a class="btn btn--secondary" href="<?= e(url('/lessons')) ?>">See the lessons</a>
    </div>
</section>
