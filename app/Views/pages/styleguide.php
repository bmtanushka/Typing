<?php
use App\Core\View;

$colours = [
    'Surfaces' => ['--bg', '--surface', '--surface-2', '--border', '--text', '--text-muted'],
    'Brand'    => ['--primary', '--primary-strong', '--primary-soft', '--accent', '--accent-soft', '--star'],
    'Feedback' => ['--success', '--success-soft', '--danger', '--danger-soft', '--warning', '--warning-soft', '--info', '--info-soft'],
];
$fingers = [
    'lp' => 'Left little finger', 'lr' => 'Left ring finger', 'lm' => 'Left middle finger', 'li' => 'Left index finger',
    'ri' => 'Right index finger', 'rm' => 'Right middle finger', 'rr' => 'Right ring finger', 'rp' => 'Right little finger',
    'th' => 'Thumbs',
];
?>
<div class="container styleguide">
    <header class="styleguide__intro">
        <p class="eyebrow">Developer only</p>
        <h1>Design system</h1>
        <p class="lead">Tokens and components used across <?= e(config('app.name')) ?>. Values are read live from CSS custom properties, so switch theme to compare.</p>
        <fieldset class="segmented" data-theme-picker>
            <legend class="visually-hidden">Theme</legend>
            <?php foreach (['system' => 'System', 'light' => 'Light', 'dark' => 'Dark'] as $val => $lab): ?>
                <label class="segmented__option">
                    <input type="radio" name="sg-theme" value="<?= $val ?>">
                    <span><?= $lab ?></span>
                </label>
            <?php endforeach; ?>
        </fieldset>
    </header>

    <nav class="styleguide__toc card" aria-label="Style guide sections">
        <ul>
            <?php foreach (['colours' => 'Colours', 'fingers' => 'Finger colours', 'type' => 'Typography', 'buttons' => 'Buttons',
                            'forms' => 'Forms', 'cards' => 'Cards', 'feedback' => 'Feedback', 'motivation' => 'Motivation',
                            'mascot' => 'Mascot', 'keyboard' => 'Keyboard', 'typing' => 'Typing text', 'map' => 'Lesson map'] as $id => $lab): ?>
                <li><a href="#sg-<?= $id ?>"><?= $lab ?></a></li>
            <?php endforeach; ?>
        </ul>
    </nav>

    <!-- Colours -->
    <section id="sg-colours" class="sg-section">
        <h2>Colours</h2>
        <?php foreach ($colours as $group => $tokens): ?>
            <h3><?= e($group) ?></h3>
            <ul class="swatches">
                <?php foreach ($tokens as $t): ?>
                    <li class="swatch">
                        <span class="swatch__chip" data-swatch="<?= e($t) ?>"></span>
                        <code><?= e($t) ?></code>
                        <span class="swatch__value text-muted" data-swatch-value="<?= e($t) ?>"></span>
                    </li>
                <?php endforeach; ?>
            </ul>
        <?php endforeach; ?>
    </section>

    <!-- Fingers -->
    <section id="sg-fingers" class="sg-section">
        <h2>Finger colours</h2>
        <p class="text-muted">Used consistently on the keyboard, the hands overlay, hints and the heatmap. Every key has a matching outline colour so the finger can be identified without relying on fill alone.</p>
        <ul class="finger-legend">
            <?php foreach ($fingers as $code => $name): ?>
                <li><span class="keycap keycap--<?= $code ?>"><?= e(strtoupper($code)) ?></span> <?= e($name) ?></li>
            <?php endforeach; ?>
        </ul>
    </section>

    <!-- Typography -->
    <section id="sg-type" class="sg-section">
        <h2>Typography</h2>
        <div class="stack">
            <p class="sg-type-sample h1-size">Heading one – 3xl</p>
            <p class="sg-type-sample h2-size">Heading two – 2xl</p>
            <p class="sg-type-sample h3-size">Heading three – xl</p>
            <p class="lead">Lead paragraph – a friendly sentence to introduce a page.</p>
            <p>Body text. Keep your eyes on the screen and let your fingers find their way home. <a href="#sg-type">This is a link</a>, and this is <strong>strong</strong> text.</p>
            <p class="text-muted">Muted text for secondary information.</p>
            <p class="small">Small print at the small size.</p>
            <p class="mono-sample">Monospace typing text: the quick brown fox 0123456789</p>
            <p>Keys inline: press <kbd>Shift</kbd> + <kbd>A</kbd> for a capital A.</p>
        </div>
    </section>

    <!-- Buttons -->
    <section id="sg-buttons" class="sg-section">
        <h2>Buttons</h2>
        <div class="cluster">
            <button class="btn btn--primary" type="button">Primary</button>
            <button class="btn btn--secondary" type="button">Secondary</button>
            <button class="btn btn--ghost" type="button">Ghost</button>
            <button class="btn btn--success" type="button">Success</button>
            <button class="btn btn--danger" type="button">Delete</button>
            <button class="btn btn--primary" type="button" disabled>Disabled</button>
        </div>
        <div class="cluster">
            <button class="btn btn--primary btn--sm" type="button">Small</button>
            <button class="btn btn--primary" type="button">Medium</button>
            <button class="btn btn--primary btn--lg" type="button">Large</button>
            <button class="btn btn--secondary btn--icon" type="button" aria-label="Settings">
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>
            </button>
        </div>
    </section>

    <!-- Forms -->
    <section id="sg-forms" class="sg-section">
        <h2>Forms</h2>
        <form class="sg-form stack" action="#" data-sg-form>
            <div class="field">
                <label class="field__label" for="sg-name">Display name</label>
                <input class="input" id="sg-name" type="text" placeholder="e.g. Sam" autocomplete="off">
                <p class="field__hint">This is shown on your dashboard.</p>
            </div>
            <div class="field field--error">
                <label class="field__label" for="sg-email">Email</label>
                <input class="input" id="sg-email" type="email" value="sam@" aria-invalid="true" aria-describedby="sg-email-err">
                <p class="field__error" id="sg-email-err">Please enter a full email address, like name@example.com.</p>
            </div>
            <div class="field">
                <label class="field__label" for="sg-layout">Keyboard layout</label>
                <select class="input" id="sg-layout"><option>UK QWERTY</option><option>US QWERTY</option></select>
            </div>
            <label class="switch">
                <input type="checkbox" role="switch" checked>
                <span class="switch__track" aria-hidden="true"></span>
                <span>Show on-screen keyboard</span>
            </label>
            <label class="check"><input type="checkbox"> Allow backspace</label>
        </form>
    </section>

    <!-- Cards -->
    <section id="sg-cards" class="sg-section">
        <h2>Cards</h2>
        <div class="grid-auto">
            <article class="card">
                <h3>Plain card</h3>
                <p class="text-muted">Rounded corners, soft shadow, generous padding.</p>
            </article>
            <article class="card card--interactive" tabindex="0">
                <h3>Interactive card</h3>
                <p class="text-muted">Lifts on hover and focus.</p>
            </article>
            <article class="card card--tinted">
                <h3>Tinted card</h3>
                <p class="text-muted">For highlighted information.</p>
            </article>
            <article class="card stat">
                <p class="stat__label">Speed</p>
                <p class="stat__value">42 <span>WPM</span></p>
                <p class="stat__delta stat__delta--up">+6 since last week</p>
            </article>
        </div>
    </section>

    <!-- Feedback -->
    <section id="sg-feedback" class="sg-section">
        <h2>Feedback</h2>
        <div class="stack">
            <div class="alert alert--info" role="status"><strong>Tip:</strong> Create a free account to save your progress on any device.</div>
            <div class="alert alert--success" role="status"><strong>Saved!</strong> Your progress is up to date.</div>
            <div class="alert alert--warning" role="status"><strong>Heads up:</strong> you’re offline – we’ll sync when you’re back.</div>
            <div class="alert alert--danger" role="alert"><strong>Oops:</strong> that password didn’t match. Have another go.</div>
        </div>
        <h3>Progress</h3>
        <div class="stack">
            <div class="progress" role="progressbar" aria-label="Lesson progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="35"><span class="progress__bar" data-progress="35"></span></div>
            <div class="progress progress--success" role="progressbar" aria-label="Unit progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="80"><span class="progress__bar" data-progress="80"></span></div>
        </div>
        <h3>Pills</h3>
        <div class="cluster">
            <span class="pill">Default</span>
            <span class="pill pill--primary">New keys: F J</span>
            <span class="pill pill--success">Passed</span>
            <span class="pill pill--warning">Problem key: D</span>
            <span class="pill pill--danger">3 errors</span>
        </div>
    </section>

    <!-- Motivation -->
    <section id="sg-motivation" class="sg-section">
        <h2>Motivation</h2>
        <div class="cluster cluster--lg">
            <?php foreach ([0, 1, 2, 3] as $n): ?>
                <span class="stars" role="img" aria-label="<?= $n ?> of 3 stars">
                    <?php for ($i = 1; $i <= 3; $i++): ?>
                        <svg class="star<?= $i <= $n ? ' star--on' : '' ?>" aria-hidden="true" width="28" height="28" viewBox="0 0 24 24"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/></svg>
                    <?php endfor; ?>
                </span>
            <?php endforeach; ?>
        </div>
        <div class="cluster cluster--lg">
            <div class="badge-medal"><span class="badge-medal__icon" aria-hidden="true">🔥</span><span>7-day streak</span></div>
            <div class="badge-medal"><span class="badge-medal__icon" aria-hidden="true">🎯</span><span>98% accuracy</span></div>
            <div class="badge-medal badge-medal--locked"><span class="badge-medal__icon" aria-hidden="true">🚀</span><span>30 WPM</span></div>
            <div class="xp"><span class="xp__level">Lv 3</span><div class="progress progress--xp" role="progressbar" aria-label="XP to next level" aria-valuemin="0" aria-valuemax="100" aria-valuenow="60"><span class="progress__bar" data-progress="60"></span></div><span class="small text-muted">240 / 400 XP</span></div>
        </div>
    </section>

    <!-- Mascot -->
    <section id="sg-mascot" class="sg-section">
        <h2>Mascot – Pip</h2>
        <div class="cluster cluster--lg cluster--end">
            <figure class="sg-figure"><?= View::render('partials/mascot', ['size' => 110, 'mood' => 'happy']) ?><figcaption>happy</figcaption></figure>
            <figure class="sg-figure"><?= View::render('partials/mascot', ['size' => 110, 'mood' => 'cheer']) ?><figcaption>cheer</figcaption></figure>
            <figure class="sg-figure"><?= View::render('partials/mascot', ['size' => 110, 'mood' => 'think']) ?><figcaption>think</figcaption></figure>
            <div class="speech speech--left"><p>Nice! Your accuracy improved by 6%. Keep that steady rhythm going.</p></div>
        </div>
    </section>

    <!-- Keyboard -->
    <section id="sg-keyboard" class="sg-section">
        <h2>Keyboard keys</h2>
        <p class="text-muted">Keycap states. The full data-driven UK/US keyboard with the hands guide is live in the <a href="<?= e(url('/demo')) ?>">typing playground</a>.</p>
        <div class="kb-preview" aria-hidden="true">
            <div class="kb-row">
                <?php foreach (['A' => 'lp', 'S' => 'lr', 'D' => 'lm', 'F' => 'li', 'G' => 'li', 'H' => 'ri', 'J' => 'ri', 'K' => 'rm', 'L' => 'rr', ';' => 'rp'] as $k => $f): ?>
                    <span class="keycap keycap--lg keycap--<?= $f ?><?= in_array($k, ['F', 'J'], true) ? ' keycap--bump' : '' ?><?= $k === 'D' ? ' is-next' : '' ?><?= $k === 'K' ? ' is-correct' : '' ?><?= $k === 'L' ? ' is-wrong' : '' ?>"><?= e($k) ?></span>
                <?php endforeach; ?>
            </div>
        </div>
        <ul class="cluster small text-muted sg-legend">
            <li><span class="keycap keycap--li keycap--bump">F</span> home bump</li>
            <li><span class="keycap keycap--lm is-next">D</span> next key</li>
            <li><span class="keycap keycap--rm is-correct">K</span> correct press</li>
            <li><span class="keycap keycap--rr is-wrong">L</span> wrong press</li>
        </ul>
    </section>

    <!-- Typing -->
    <section id="sg-typing" class="sg-section">
        <h2>Typing text</h2>
        <div class="typing-surface card">
            <p class="typing-text" aria-label="Example typing text">
                <?php
                $sample = 'fjf jfj dkd kdk';
                $pos = 7;
                foreach (mb_str_split($sample) as $i => $ch) {
                    $cls = $i < $pos ? ($i === 3 ? 'ch ch--error' : 'ch ch--correct') : ($i === $pos ? 'ch ch--current' : 'ch');
                    echo '<span class="' . $cls . '">' . ($ch === ' ' ? '&nbsp;' : e($ch)) . '</span>';
                }
                ?>
            </p>
            <div class="typing-stats">
                <div><span class="typing-stats__value">24</span><span class="typing-stats__label">WPM</span></div>
                <div><span class="typing-stats__value">96%</span><span class="typing-stats__label">Accuracy</span></div>
                <div><span class="typing-stats__value">0:18</span><span class="typing-stats__label">Time</span></div>
            </div>
        </div>
        <ul class="cluster small text-muted sg-legend">
            <li><span class="ch ch--correct">a</span> correct</li>
            <li><span class="ch ch--error">b</span> error</li>
            <li><span class="ch ch--current">c</span> current</li>
            <li><span class="ch">d</span> upcoming</li>
        </ul>
    </section>

    <!-- Map -->
    <section id="sg-map" class="sg-section">
        <h2>Lesson map nodes</h2>
        <div class="cluster cluster--lg">
            <?php foreach ([['F J', 3, 'done'], ['D K', 2, 'done'], ['S L', 0, 'current'], ['A ;', 0, 'locked']] as [$keys, $stars, $state]): ?>
                <a class="map-node map-node--<?= $state ?>" href="#sg-map" <?= $state === 'locked' ? 'aria-disabled="true"' : '' ?>>
                    <span class="map-node__disc">
                        <?php if ($state === 'locked'): ?>
                            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
                        <?php else: ?>
                            <?= e($keys) ?>
                        <?php endif; ?>
                    </span>
                    <span class="map-node__label"><?= e($keys) ?><span class="visually-hidden"> – <?= e($state) ?><?= $stars ? ", {$stars} stars" : '' ?></span></span>
                    <span class="map-node__stars" aria-hidden="true"><?= str_repeat('★', $stars) . str_repeat('☆', $state === 'done' ? 3 - $stars : 0) ?></span>
                </a>
            <?php endforeach; ?>
        </div>
    </section>
</div>
