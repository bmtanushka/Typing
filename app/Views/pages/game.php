<?php
use App\Core\View;
/** @var string $gameId @var string $gameTitle @var string $blurb @var string $how */
?>
<div class="container game-page" data-game="<?= e($gameId) ?>">
    <div class="game-page__bar">
        <a class="btn btn--ghost btn--sm" href="<?= e(url('/games')) ?>">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Games
        </a>
        <h1 class="game-page__title"><?= e($gameTitle) ?></h1>
        <dl class="game-hud" aria-label="Game status">
            <div><dt>Score</dt><dd data-hud="score">0</dd></div>
            <div><dt>Lives</dt><dd data-hud="lives" aria-label="lives">–</dd></div>
            <div><dt>Level</dt><dd data-hud="level">1</dd></div>
        </dl>
    </div>

    <div class="game-stage" data-stage>
        <canvas class="game-canvas" data-canvas tabindex="0" role="img"
                aria-label="<?= e($gameTitle) ?> game area. <?= e($how) ?>"></canvas>
        <p class="visually-hidden" aria-live="polite" data-game-live></p>

        <div class="game-overlay" data-start>
            <div class="game-overlay__card card">
                <?= View::render('partials/mascot', ['size' => 70, 'mood' => 'happy']) ?>
                <h2><?= e($gameTitle) ?></h2>
                <p><?= e($how) ?></p>
                <form class="stack game-options" data-options>
                    <fieldset class="settings__row">
                        <legend class="field__label">Difficulty</legend>
                        <div class="segmented">
                            <?php foreach (['gentle' => 'Gentle', 'normal' => 'Normal', 'speedy' => 'Speedy'] as $v => $l): ?>
                                <label class="segmented__option"><input type="radio" name="difficulty" value="<?= $v ?>" <?= $v === 'gentle' ? 'checked' : '' ?>><span><?= $l ?></span></label>
                            <?php endforeach; ?>
                        </div>
                    </fieldset>
                    <div class="field">
                        <label class="field__label" for="g-keys">Keys</label>
                        <select class="input" id="g-keys" name="keys">
                            <option value="learnt">Only keys I’ve learnt</option>
                            <option value="home">Home row only</option>
                            <option value="all">All letters</option>
                        </select>
                    </div>
                    <label class="switch"><input type="checkbox" role="switch" name="sound"><span class="switch__track" aria-hidden="true"></span><span>Sound effects</span></label>
                    <p class="small text-muted" data-best-line></p>
                    <button class="btn btn--primary btn--lg" type="submit" data-play>Play</button>
                </form>
            </div>
        </div>

        <div class="game-overlay" data-pause hidden>
            <div class="game-overlay__card card">
                <h2>Paused</h2>
                <p>Take a breather. Press the button or Esc to carry on.</p>
                <button class="btn btn--primary btn--lg" type="button" data-resume>Resume</button>
            </div>
        </div>

        <div class="game-overlay" data-results hidden>
            <div class="game-overlay__card card" tabindex="-1" data-results-card>
                <div data-results-mascot></div>
                <h2 data-results-title>Well played!</h2>
                <p class="lead" data-results-detail></p>
                <div class="game-results__stats">
                    <div class="stat"><p class="stat__label">Score</p><p class="stat__value" data-res="score">0</p></div>
                    <div class="stat"><p class="stat__label">Best</p><p class="stat__value" data-res="best">0</p></div>
                    <div class="stat"><p class="stat__label">Accuracy</p><p class="stat__value"><span data-res="accuracy">0</span><span>%</span></p></div>
                </div>
                <p class="pill pill--success" data-res-xp></p>
                <ul class="cluster game-results__badges" data-res-badges></ul>
                <div class="cluster">
                    <button class="btn btn--primary" type="button" data-again>Play again</button>
                    <a class="btn btn--secondary" href="<?= e(url('/games')) ?>">Choose another game</a>
                </div>
            </div>
        </div>
    </div>
    <p class="small text-muted game-page__help">Press <kbd>Esc</kbd> to pause. Games use a physical keyboard.</p>
</div>
