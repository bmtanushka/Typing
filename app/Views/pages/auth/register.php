<?php use App\Core\View; /** @var string $next */ ?>
<div class="container auth">
    <section class="auth__card card">
        <div class="auth__head">
            <?= View::render('partials/mascot', ['size' => 70, 'mood' => 'cheer']) ?>
            <div>
                <h1>Create your free account</h1>
                <p class="text-muted">Keep your stars, badges and streak safe – and carry on from any device.</p>
            </div>
        </div>
        <form class="stack" data-auth-form="register" data-next="<?= e($next) ?>" novalidate>
            <div class="alert alert--danger" role="alert" data-form-error hidden></div>
            <?= View::render('pages/auth/_field', ['name' => 'displayName', 'label' => 'Your name', 'type' => 'text', 'autocomplete' => 'nickname', 'required' => true, 'hint' => 'Shown on your dashboard. A first name or nickname is perfect.']) ?>
            <?= View::render('pages/auth/_field', ['name' => 'email', 'label' => 'Email', 'type' => 'email', 'autocomplete' => 'email', 'required' => true, 'hint' => 'Only used to log in and reset your password.']) ?>
            <?= View::render('pages/auth/_field', ['name' => 'password', 'label' => 'Password', 'type' => 'password', 'autocomplete' => 'new-password', 'required' => true, 'minlength' => 8, 'hint' => 'At least 8 characters.']) ?>
            <button class="btn btn--primary btn--lg auth__submit" type="submit">Create account</button>
        </form>
        <p class="auth__switch">Already have an account? <a href="<?= e(url('/login') . '?next=' . rawurlencode($next)) ?>">Log in</a></p>
    </section>
    <p class="auth__note small text-muted">Your guest progress on this device moves into your new account automatically. See our <a href="<?= e(url('/privacy')) ?>">privacy notice</a>.</p>
</div>
