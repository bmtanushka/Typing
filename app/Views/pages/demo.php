<div class="container demo">
    <header class="demo__intro">
        <div>
            <p class="eyebrow">Typing playground</p>
            <h1>Try it out</h1>
            <p class="lead">Rest your fingers on the home row and start typing. The keyboard and hands show which finger to use next.</p>
        </div>
        <?= \App\Core\View::render('partials/mascot', ['size' => 90, 'mood' => 'happy']) ?>
    </header>

    <form class="demo__controls card" data-demo-controls aria-label="Practice settings">
        <div class="field">
            <label class="field__label" for="demo-text">Text</label>
            <select class="input" id="demo-text" name="text">
                <option value="home">Home row drill</option>
                <option value="words" selected>Easy words</option>
                <option value="sentence">A sentence</option>
                <option value="symbols">Capitals and punctuation</option>
                <option value="custom">My own text…</option>
            </select>
        </div>
        <div class="field">
            <label class="field__label" for="demo-time">Time</label>
            <select class="input" id="demo-time" name="time">
                <option value="0" selected>Until the end</option>
                <option value="30">30 seconds</option>
                <option value="60">1 minute</option>
            </select>
        </div>
        <div class="field">
            <label class="field__label" for="demo-layout">Keyboard layout</label>
            <select class="input" id="demo-layout" name="layout">
                <option value="uk">UK QWERTY</option>
                <option value="us">US QWERTY</option>
            </select>
        </div>
        <div class="demo__toggles">
            <label class="switch"><input type="checkbox" role="switch" name="stopOnError"><span class="switch__track" aria-hidden="true"></span><span>Beginner mode (stop on errors)</span></label>
            <label class="switch"><input type="checkbox" role="switch" name="allowBackspace" checked><span class="switch__track" aria-hidden="true"></span><span>Allow backspace</span></label>
            <label class="switch"><input type="checkbox" role="switch" name="showKeyboard" checked><span class="switch__track" aria-hidden="true"></span><span>Show keyboard</span></label>
            <label class="switch"><input type="checkbox" role="switch" name="showHands" checked><span class="switch__track" aria-hidden="true"></span><span>Show hands</span></label>
            <label class="switch"><input type="checkbox" role="switch" name="large"><span class="switch__track" aria-hidden="true"></span><span>Large text</span></label>
        </div>
        <div class="field demo__custom" hidden data-custom>
            <label class="field__label" for="demo-custom">Your text</label>
            <textarea class="input" id="demo-custom" name="custom" rows="3" maxlength="2000" placeholder="Paste or type any text to practise…"></textarea>
            <button class="btn btn--secondary btn--sm" type="button" data-use-custom>Use this text</button>
        </div>
    </form>

    <section class="demo__stage" aria-label="Typing exercise">
        <div class="demo__stats" role="group" aria-label="Live statistics">
            <div class="demo__stat"><span class="demo__stat-value" data-stat="wpm">0</span><span class="demo__stat-label">WPM</span></div>
            <div class="demo__stat"><span class="demo__stat-value" data-stat="accuracy">100%</span><span class="demo__stat-label">Accuracy</span></div>
            <div class="demo__stat"><span class="demo__stat-value" data-stat="time">0:00</span><span class="demo__stat-label" data-stat="time-label">Time</span></div>
            <div class="demo__stat"><span class="demo__stat-value" data-stat="errors">0</span><span class="demo__stat-label">Errors</span></div>
            <button class="btn btn--ghost btn--sm demo__restart" type="button" data-restart>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
                Restart
            </button>
        </div>

        <div data-typing></div>

        <div class="demo__notices">
            <p class="alert alert--warning" role="status" hidden data-caps>Caps Lock is on – turn it off to type lower-case letters.</p>
            <div class="speech speech--hint" role="status" hidden data-hint></div>
        </div>

        <div class="demo__results card" hidden data-results tabindex="-1">
            <div class="demo__results-head">
                <?= \App\Core\View::render('partials/mascot', ['size' => 80, 'mood' => 'cheer']) ?>
                <div>
                    <h2 data-results-title>Well done!</h2>
                    <p class="text-muted" data-results-message></p>
                </div>
            </div>
            <div class="demo__results-grid">
                <div class="stat"><p class="stat__label">Speed</p><p class="stat__value"><span data-r="wpm"></span> <span>WPM</span></p></div>
                <div class="stat"><p class="stat__label">Accuracy</p><p class="stat__value"><span data-r="accuracy"></span><span>%</span></p></div>
                <div class="stat"><p class="stat__label">Raw speed</p><p class="stat__value"><span data-r="rawWpm"></span> <span>WPM</span></p></div>
                <div class="stat"><p class="stat__label">Time</p><p class="stat__value"><span data-r="time"></span></p></div>
            </div>
            <div data-problem-wrap>
                <h3 class="demo__problem-title">Keys to practise</h3>
                <ul class="cluster" data-problem></ul>
            </div>
            <div class="cluster">
                <button class="btn btn--primary" type="button" data-retry>Try again</button>
                <button class="btn btn--secondary" type="button" data-next-text>Another text</button>
            </div>
        </div>

        <div class="demo__guides">
            <div data-keyboard></div>
            <div data-hands></div>
        </div>
    </section>
    <p class="small text-muted demo__help">Tip: press <kbd>Esc</kbd> to pause. Your settings are remembered on this device.</p>
</div>
