<section class="hero">
    <div class="container hero__inner">
        <div class="hero__copy">
            <p class="eyebrow">Free · No account needed</p>
            <h1 class="hero__title">Learn to type without looking – <span class="text-gradient">one key at a time.</span></h1>
            <p class="hero__lead">Short, friendly lessons take you from the home row to full speed.
                Practise with games, track your progress and celebrate every win.</p>
            <div class="hero__actions">
                <a class="btn btn--primary btn--lg" href="<?= e(url('/lessons/gs-welcome')) ?>" data-start-link>
                    Start typing
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </a>
                <a class="btn btn--secondary btn--lg" href="<?= e(url('/demo')) ?>">Try the playground</a>
            </div>
            <p class="hero__note">Already a confident typist? <a href="<?= e(url('/placement')) ?>">Skip ahead with a quick placement test</a>.</p>
        </div>
        <div class="hero__art" aria-hidden="true">
            <div class="speech">
                <p>Hi, I’m Pip! Rest your fingers on the keys with the little bumps – <kbd>F</kbd> and <kbd>J</kbd>.</p>
            </div>
            <?= \App\Core\View::render('partials/mascot', ['size' => 170, 'mood' => 'happy']) ?>
            <div class="hero__keys">
                <?php foreach (['a' => 'lp', 's' => 'lr', 'd' => 'lm', 'f' => 'li', 'j' => 'ri', 'k' => 'rm', 'l' => 'rr', ';' => 'rp'] as $k => $f): ?>
                    <span class="keycap keycap--<?= $f ?><?= in_array($k, ['f', 'j'], true) ? ' keycap--bump' : '' ?>"><?= e(strtoupper($k)) ?></span>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</section>

<section class="container features" aria-labelledby="features-title">
    <h2 id="features-title" class="section-title">How it works</h2>
    <ol class="features__grid">
        <li class="card feature">
            <span class="feature__num" aria-hidden="true">1</span>
            <h3>Learn</h3>
            <p>Meet each new key, see which finger to use and watch the movement.</p>
        </li>
        <li class="card feature">
            <span class="feature__num" aria-hidden="true">2</span>
            <h3>Practise</h3>
            <p>Bite-sized drills and real words using only the keys you already know.</p>
        </li>
        <li class="card feature">
            <span class="feature__num" aria-hidden="true">3</span>
            <h3>Play</h3>
            <p>Pop balloons, catch falling letters and race the clock.</p>
        </li>
        <li class="card feature">
            <span class="feature__num" aria-hidden="true">4</span>
            <h3>Grow</h3>
            <p>Earn stars, badges and streaks as your speed and accuracy climb.</p>
        </li>
    </ol>
</section>
