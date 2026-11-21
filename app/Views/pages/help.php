<?php use App\Core\View; ?>
<div class="container prose-page">
    <header class="prose-page__head">
        <div>
            <p class="eyebrow">Help and technique</p>
            <h1>How to touch type</h1>
            <p class="lead">A few good habits make all the difference. Here’s everything Pip wishes every new typist knew.</p>
        </div>
        <?= View::render('partials/mascot', ['size' => 90, 'mood' => 'happy']) ?>
    </header>

    <nav class="card prose-page__toc" aria-label="On this page">
        <ul>
            <li><a href="#posture">Sitting comfortably</a></li>
            <li><a href="#home">The home row</a></li>
            <li><a href="#fingers">Which finger for which key</a></li>
            <li><a href="#technique">Technique tips</a></li>
            <li><a href="#how">How KeyQuest works</a></li>
            <li><a href="#faq">Questions</a></li>
        </ul>
    </nav>

    <article class="prose">
        <section id="posture">
            <h2>Sitting comfortably</h2>
            <ul>
                <li>Sit back in your chair with your feet flat on the floor and your shoulders relaxed.</li>
                <li>Keep your elbows close to your sides, bent at roughly a right angle.</li>
                <li>Let your wrists float just above the keyboard – don’t rest them on the desk while you type.</li>
                <li>Put the screen at about eye level and an arm’s length away.</li>
                <li>Take a short break every 20 minutes: stretch your fingers and look at something far away.</li>
            </ul>
        </section>

        <section id="home">
            <h2>The home row</h2>
            <p>Your fingers always start – and return to – the home row: <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <kbd>F</kbd> for the left hand and <kbd>J</kbd> <kbd>K</kbd> <kbd>L</kbd> <kbd>;</kbd> for the right. Your thumbs rest on the space bar.</p>
            <p>Feel for the small bumps on <kbd>F</kbd> and <kbd>J</kbd>. They let you find home without looking, every time.</p>
        </section>

        <section id="fingers">
            <h2>Which finger for which key</h2>
            <p>Each finger looks after a column of keys, sloping slightly to the left. The on-screen keyboard colours every key by finger:</p>
            <ul class="finger-legend">
                <?php foreach (['lp' => 'Left little finger: Q A Z, 1, Tab, Caps and left Shift', 'lr' => 'Left ring finger: W S X, 2', 'lm' => 'Left middle finger: E D C, 3', 'li' => 'Left index finger: R F V T G B, 4 5',
                                'ri' => 'Right index finger: Y H N U J M, 6 7', 'rm' => 'Right middle finger: I K comma, 8', 'rr' => 'Right ring finger: O L full stop, 9', 'rp' => 'Right little finger: P ; / and the keys to the right, 0, Enter and right Shift',
                                'th' => 'Thumbs: the space bar'] as $f => $label): ?>
                    <li><span class="keycap keycap--<?= $f ?>" aria-hidden="true"><?= e(strtoupper($f)) ?></span> <?= e($label) ?></li>
                <?php endforeach; ?>
            </ul>
            <p>For capital letters, hold <strong>Shift with the opposite hand</strong>: left Shift for letters typed with your right hand, and right Shift for letters typed with your left hand.</p>
        </section>

        <section id="technique">
            <h2>Technique tips</h2>
            <ul>
                <li><strong>Eyes on the screen.</strong> Glance at the on-screen keyboard instead of your hands.</li>
                <li><strong>Accuracy first.</strong> Speed grows naturally from accurate, relaxed typing.</li>
                <li><strong>Light taps.</strong> A gentle press is faster and kinder to your fingers than a hard one.</li>
                <li><strong>Steady rhythm.</strong> Aim for an even beat, like a ticking clock, rather than bursts.</li>
                <li><strong>Little and often.</strong> Ten minutes a day beats an hour once a week.</li>
            </ul>
        </section>

        <section id="how">
            <h2>How KeyQuest works</h2>
            <p>Each lesson introduces one or two new keys, then you practise them in short steps: meet the keys, a guided drill, real words and a hands-on challenge. Finish with good accuracy to earn up to three stars. Each unit ends with a checkpoint – pass it to move on, or take it early to skip ahead.</p>
            <p>You earn <strong>XP</strong> for every lesson, practice session, typing test and game, and level up as it grows. Practise on consecutive days to build a <strong>streak</strong>, and collect <strong>badges</strong> for milestones.</p>
            <p><strong>WPM</strong> (words per minute) counts five characters as one word and only counts characters you typed correctly. <strong>Accuracy</strong> is the share of key presses that were right first time.</p>
        </section>

        <section id="faq">
            <h2>Questions</h2>
            <details class="faq">
                <summary>Do I need an account?</summary>
                <p>No. Everything works straight away, and your progress is saved in this browser. A free account keeps it safe and lets you carry on from any device – anything you did as a guest is added to your account when you sign up.</p>
            </details>
            <details class="faq">
                <summary>My keyboard is different from the one on screen.</summary>
                <p>Choose <strong>UK</strong> or <strong>US</strong> layout in <a href="<?= e(url('/settings')) ?>">Settings</a>. The main difference is where symbols such as <kbd>@</kbd>, <kbd>"</kbd>, <kbd>#</kbd> and <kbd>£</kbd> live.</p>
            </details>
            <details class="faq">
                <summary>Can I use a phone or tablet?</summary>
                <p>Touch typing needs a physical keyboard. On a tablet, connect a Bluetooth keyboard and everything will work.</p>
            </details>
            <details class="faq">
                <summary>I already type well. Do I have to start at the beginning?</summary>
                <p>Not at all – take the one-minute <a href="<?= e(url('/placement')) ?>">placement test</a> and skip the units you already know.</p>
            </details>
            <details class="faq">
                <summary>Can I turn off the sounds, keyboard or hands?</summary>
                <p>Yes – sounds are off unless you switch them on, and you can hide the keyboard and hands, change the text size and choose a dark theme in <a href="<?= e(url('/settings')) ?>">Settings</a>.</p>
            </details>
            <details class="faq">
                <summary>Why was my result not saved to my account?</summary>
                <p>Results are checked to make sure they’re realistic. Extremely high speeds (over 250 words per minute) are ignored. If you were offline, your results are saved when you reconnect.</p>
            </details>
        </section>
    </article>
</div>
