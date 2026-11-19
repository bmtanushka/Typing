<?php use App\Core\View; /** @var string $next */ ?>
<div class="container auth">
    <section class="auth__card card">
        <div class="auth__head">
            <?= View::render('partials/mascot', ['size' => 70, 'mood' => 'happy']) ?>
            <div>
                <h1>Welcome back</h1>
                <p class="text-muted">Log in to pick up where you left off on any device.</p>
            </div>
        </div>
        <form class="stack" data-auth-form="login" data-next="<?= e($next) ?>" novalidate>
            <div class="alert alert--danger" role="alert" data-form-error hidden></div>
            <?= View::render('pages/auth/_field', ['name' => 'email', 'label' => 'Email', 'type' => 'email', 'autocomplete' => 'email', 'required' => true]) ?>
            <?= View::render('pages/auth/_field', ['name' => 'password', 'label' => 'Password', 'type' => 'password', 'autocomplete' => 'current-password', 'required' => true]) ?>
            <button class="btn btn--primary btn--lg auth__submit" type="submit">Log in</button>
            <p class="auth__links small"><a href="<?= e(url('/forgot-password')) ?>">Forgotten your password?</a></p>
        </form>
        <p class="auth__switch">New here? <a href="<?= e(url('/register') . '?next=' . rawurlencode($next)) ?>">Create a free account</a></p>
    </section>
    <p class="auth__note small text-muted">Any progress you made as a guest on this device is added to your account when you log in.</p>
</div>
