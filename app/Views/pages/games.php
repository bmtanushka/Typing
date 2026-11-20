<?php use App\Core\View; /** @var array $games */ ?>
<div class="container games-hub">
    <header class="practice__intro">
        <div>
            <p class="eyebrow">Games</p>
            <h1>Play and practise</h1>
            <p class="lead">Every game uses only the keys you’ve learnt so far, so they get richer as you progress. Start gently and work your way up.</p>
        </div>
        <?= View::render('partials/mascot', ['size' => 84, 'mood' => 'cheer']) ?>
    </header>

    <ul class="games-grid">
        <?php foreach ($games as $id => [$title, $blurb, , $colour]): ?>
            <li>
                <a class="game-card game-card--<?= e($colour) ?>" href="<?= e(url('/games/' . $id)) ?>" data-game-card="<?= e($id) ?>">
                    <span class="game-card__art game-card__art--<?= e($id) ?>" aria-hidden="true"></span>
                    <span class="game-card__body">
                        <span class="game-card__title"><?= e($title) ?></span>
                        <span class="game-card__blurb"><?= e($blurb) ?></span>
                        <span class="game-card__best small" data-best>Not played yet</span>
                    </span>
                </a>
            </li>
        <?php endforeach; ?>
    </ul>
</div>
