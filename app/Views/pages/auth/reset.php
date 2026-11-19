<?php use App\Core\View; /** @var string $token */ ?>
<div class="container auth">
    <section class="auth__card card">
        <div class="auth__head">
            <?= View::render('partials/mascot', ['size' => 70, 'mood' => 'happy']) ?>
            <div>
                <h1>Choose a new password</h1>
                <p class="text-muted">Make it at least 8 characters – a short phrase works well.</p>
            </div>
        </div>
        <?php if ($token === ''): ?>
            <div class="alert alert--warning" role="alert">This link isn’t complete. Please use the link from your email, or <a href="<?= e(url('/forgot-password')) ?>">ask for a new one</a>.</div>
        <?php else: ?>
            <form class="stack" data-auth-form="reset" data-token="<?= e($token) ?>" data-next="/progress" novalidate>
                <div class="alert alert--danger" role="alert" data-form-error hidden></div>
                <?= View::render('pages/auth/_field', ['name' => 'password', 'label' => 'New password', 'type' => 'password', 'autocomplete' => 'new-password', 'required' => true, 'minlength' => 8]) ?>
                <button class="btn btn--primary btn--lg auth__submit" type="submit">Save new password</button>
            </form>
        <?php endif; ?>
    </section>
</div>
