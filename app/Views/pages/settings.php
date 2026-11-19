<div class="container page-narrow settings">
    <header class="settings__intro">
        <p class="eyebrow">Make it yours</p>
        <h1>Settings</h1>
        <p class="lead">Changes are saved straight away on this device.</p>
        <p class="settings__saved pill pill--success" role="status" data-saved hidden>Saved</p>
    </header>

    <form class="stack" data-settings aria-label="Settings">
        <section class="card settings__group" aria-labelledby="set-look">
            <h2 id="set-look">Look and feel</h2>
            <fieldset class="settings__row">
                <legend class="field__label">Theme</legend>
                <div class="segmented">
                    <?php foreach (['system' => 'System', 'light' => 'Light', 'dark' => 'Dark'] as $v => $l): ?>
                        <label class="segmented__option"><input type="radio" name="theme" value="<?= $v ?>"><span><?= $l ?></span></label>
                    <?php endforeach; ?>
                </div>
            </fieldset>
            <fieldset class="settings__row">
                <legend class="field__label">Text size</legend>
                <div class="segmented">
                    <?php foreach (['small' => 'Small', 'normal' => 'Normal', 'large' => 'Large', 'xlarge' => 'Extra large'] as $v => $l): ?>
                        <label class="segmented__option"><input type="radio" name="fontSize" value="<?= $v ?>"><span><?= $l ?></span></label>
                    <?php endforeach; ?>
                </div>
            </fieldset>
        </section>

        <section class="card settings__group" aria-labelledby="set-keyboard">
            <h2 id="set-keyboard">Keyboard and guides</h2>
            <div class="field settings__row">
                <label class="field__label" for="set-layout">Keyboard layout</label>
                <select class="input" id="set-layout" name="layout">
                    <option value="auto">Automatic (from your browser)</option>
                    <option value="uk">UK QWERTY</option>
                    <option value="us">US QWERTY</option>
                </select>
                <p class="field__hint">Changes the on-screen keyboard and finger guides to match yours.</p>
            </div>
            <label class="switch settings__row"><input type="checkbox" role="switch" name="showKeyboard"><span class="switch__track" aria-hidden="true"></span><span>Show the on-screen keyboard</span></label>
            <label class="switch settings__row"><input type="checkbox" role="switch" name="showHands"><span class="switch__track" aria-hidden="true"></span><span>Show the hands guide</span></label>
            <label class="switch settings__row"><input type="checkbox" role="switch" name="allowBackspace"><span class="switch__track" aria-hidden="true"></span><span>Allow backspace to fix mistakes</span></label>
        </section>

        <section class="card settings__group" aria-labelledby="set-sound">
            <h2 id="set-sound">Sound</h2>
            <div class="settings__row settings__row--inline">
                <label class="switch"><input type="checkbox" role="switch" name="sound"><span class="switch__track" aria-hidden="true"></span><span>Soft key clicks and success chimes</span></label>
                <button class="btn btn--secondary btn--sm" type="button" data-test-sound>Play a sample</button>
            </div>
        </section>

        <section class="card settings__group" aria-labelledby="set-data">
            <h2 id="set-data">Your progress</h2>
            <p class="text-muted">Your progress is stored in this browser. Create a free account (coming soon) to keep it safe on any device.</p>
            <div class="cluster">
                <button class="btn btn--secondary" type="button" data-export>Download my progress</button>
                <button class="btn btn--danger" type="button" data-reset>Reset progress…</button>
            </div>
        </section>
    </form>

    <dialog class="dialog" data-reset-dialog aria-labelledby="reset-title">
        <form method="dialog" class="stack">
            <h2 id="reset-title">Start again from scratch?</h2>
            <p>This removes your stars, XP, streak, badges and statistics from this browser. Your settings stay as they are. This can’t be undone.</p>
            <div class="cluster">
                <button class="btn btn--danger" value="reset" data-confirm-reset>Yes, reset my progress</button>
                <button class="btn btn--secondary" value="cancel" autofocus>Keep my progress</button>
            </div>
        </form>
    </dialog>
</div>
