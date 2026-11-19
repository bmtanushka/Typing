<?php use App\Core\View; /** @var array $user */ ?>
<div class="container account">
    <header class="account__head">
        <span class="account-chip__avatar account-chip__avatar--lg" aria-hidden="true"><?= e(mb_strtoupper(mb_substr($user['display_name'], 0, 1))) ?></span>
        <div>
            <p class="eyebrow">Your account</p>
            <h1>Hello, <span data-display-name><?= e($user['display_name']) ?></span></h1>
            <p class="text-muted">Member since <?= e(date('j F Y', strtotime($user['created_at'] . ' UTC'))) ?> · <a href="<?= e(url('/progress')) ?>">See your progress</a></p>
        </div>
        <button class="btn btn--secondary account__logout" type="button" data-logout>Log out</button>
    </header>

    <div class="account__grid">
        <section class="card" aria-labelledby="acc-profile">
            <h2 id="acc-profile">Your details</h2>
            <form class="stack" data-auth-form="profile" novalidate>
                <div class="alert alert--danger" role="alert" data-form-error hidden></div>
                <div class="alert alert--success" role="status" data-form-success hidden></div>
                <?= View::render('pages/auth/_field', ['name' => 'displayName', 'label' => 'Your name', 'type' => 'text', 'autocomplete' => 'nickname', 'value' => $user['display_name'], 'required' => true]) ?>
                <?= View::render('pages/auth/_field', ['name' => 'email', 'label' => 'Email', 'type' => 'email', 'autocomplete' => 'email', 'value' => $user['email'], 'required' => true]) ?>
                <button class="btn btn--primary" type="submit">Save details</button>
            </form>
        </section>

        <section class="card" aria-labelledby="acc-password">
            <h2 id="acc-password">Change password</h2>
            <form class="stack" data-auth-form="password" novalidate>
                <div class="alert alert--danger" role="alert" data-form-error hidden></div>
                <div class="alert alert--success" role="status" data-form-success hidden></div>
                <?= View::render('pages/auth/_field', ['name' => 'current', 'label' => 'Current password', 'type' => 'password', 'autocomplete' => 'current-password', 'required' => true]) ?>
                <?= View::render('pages/auth/_field', ['name' => 'password', 'label' => 'New password', 'type' => 'password', 'autocomplete' => 'new-password', 'required' => true, 'minlength' => 8, 'hint' => 'At least 8 characters.']) ?>
                <button class="btn btn--primary" type="submit">Change password</button>
            </form>
        </section>

        <section class="card" aria-labelledby="acc-data">
            <h2 id="acc-data">Your data</h2>
            <p class="text-muted">Download everything we store about you, or delete your account for good.</p>
            <div class="cluster">
                <a class="btn btn--secondary" href="<?= e(url('/api/account/export')) ?>" download>Download my data</a>
                <button class="btn btn--danger" type="button" data-delete-open>Delete my account…</button>
            </div>
        </section>
    </div>

    <dialog class="dialog" data-delete-dialog aria-labelledby="del-title">
        <form class="stack" data-auth-form="delete" novalidate>
            <h2 id="del-title">Delete your account?</h2>
            <p>This permanently removes your account, stars, results, badges and statistics. It can’t be undone.</p>
            <div class="alert alert--danger" role="alert" data-form-error hidden></div>
            <?= View::render('pages/auth/_field', ['name' => 'password', 'label' => 'Type your password to confirm', 'type' => 'password', 'autocomplete' => 'current-password', 'required' => true]) ?>
            <div class="cluster">
                <button class="btn btn--danger" type="submit">Delete for good</button>
                <button class="btn btn--secondary" type="button" data-delete-cancel>Keep my account</button>
            </div>
        </form>
    </dialog>
</div>
