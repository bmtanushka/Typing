<?php use App\Core\View; ?>
<div class="container auth">
    <section class="auth__card card">
        <div class="auth__head">
            <?= View::render('partials/mascot', ['size' => 70, 'mood' => 'think']) ?>
            <div>
                <h1>Forgotten your password?</h1>
                <p class="text-muted">No problem – we’ll email you a link to choose a new one.</p>
            </div>
        </div>
        <form class="stack" data-auth-form="forgot" novalidate>
            <div class="alert alert--danger" role="alert" data-form-error hidden></div>
            <div class="alert alert--success" role="status" data-form-success hidden></div>
            <?= View::render('pages/auth/_field', ['name' => 'email', 'label' => 'Email', 'type' => 'email', 'autocomplete' => 'email', 'required' => true]) ?>
            <button class="btn btn--primary btn--lg auth__submit" type="submit">Send reset link</button>
        </form>
        <p class="auth__switch"><a href="<?= e(url('/login')) ?>">Back to log in</a></p>
    </section>
</div>
