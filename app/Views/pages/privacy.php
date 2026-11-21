<?php /** @var ?string $contact */ ?>
<div class="container prose-page">
    <header class="prose-page__head">
        <div>
            <p class="eyebrow">Privacy</p>
            <h1>Your privacy</h1>
            <p class="lead">We keep as little as possible, never sell it and never show adverts. Here is exactly what we store and why.</p>
        </div>
    </header>

    <article class="prose">
        <section>
            <h2>Without an account</h2>
            <p>If you never create an account, your progress, settings, badges and scores are stored only <strong>in your own browser</strong> (using “local storage”). Nothing about your typing is sent to us. You can download it or reset it at any time in <a href="<?= e(url('/settings')) ?>">Settings</a>.</p>
        </section>

        <section>
            <h2>With a free account</h2>
            <p>When you create an account we store:</p>
            <ul>
                <li>your <strong>display name</strong> and <strong>email address</strong> – to log you in and to send password-reset emails;</li>
                <li>your <strong>password</strong>, only as a secure one-way hash (we can’t see or recover it);</li>
                <li>your <strong>progress</strong>: lesson stars, results (speed, accuracy, time), per-key statistics, badges, game scores, XP, streak and settings.</li>
            </ul>
            <p>We use this only to run KeyQuest for you – to save your progress, show your charts and keep your account secure.</p>
        </section>

        <section>
            <h2>Cookies</h2>
            <p>We use <strong>one cookie</strong>, and only after you log in or start signing up: a session cookie that keeps you logged in. It is strictly necessary, so no consent banner is needed. There are <strong>no tracking, analytics or advertising cookies</strong>, and no third-party scripts or fonts.</p>
        </section>

        <section>
            <h2>Security records</h2>
            <p>To stop people guessing passwords, we briefly record the IP address and email address of login, sign-up and password-reset attempts. These records are deleted automatically after two days. Password-reset links expire after one hour. Our hosting provider also keeps standard server logs for a short time.</p>
        </section>

        <section>
            <h2>Your choices</h2>
            <ul>
                <li><strong>Download your data</strong> as a JSON file from your <a href="<?= e(url('/account')) ?>">Account page</a>.</li>
                <li><strong>Change</strong> your name, email or password at any time.</li>
                <li><strong>Delete your account</strong> – this permanently removes your account and all of your progress straight away.</li>
            </ul>
        </section>

        <section>
            <h2>Children</h2>
            <p>KeyQuest is designed to be friendly for young learners. Children can use it without an account. If a child creates an account, we only store what is listed above, and a parent or guardian can download or delete it at any time.</p>
        </section>

        <section>
            <h2>Questions</h2>
            <?php if (!empty($contact)): ?>
                <p>If you have any questions about your data, email <a href="mailto:<?= e($contact) ?>"><?= e($contact) ?></a>.</p>
            <?php else: ?>
                <p>If you have any questions about your data, please contact the owner of this website.</p>
            <?php endif; ?>
            <p class="small text-muted">Last updated <?= e(date('j F Y', filemtime(__FILE__))) ?>.</p>
        </section>
    </article>
</div>
