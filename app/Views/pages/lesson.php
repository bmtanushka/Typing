<?php
/** @var array $lesson @var string $unitTitle */
$json = static fn ($v): string => json_encode($v, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
?>
<div class="player" data-player>
    <div class="player__bar container">
        <a class="btn btn--ghost btn--sm player__back" href="<?= e(url('/lessons')) ?>">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Lessons
        </a>
        <div class="player__heading">
            <p class="player__unit"><?= e($unitTitle) ?></p>
            <h1 class="player__title"><?= e($lesson['title']) ?></h1>
        </div>
        <ol class="player__steps" data-steps aria-label="Lesson steps"></ol>
    </div>

    <div class="container player__stage" data-stage aria-live="polite">
        <noscript><p class="alert alert--warning">Lessons need JavaScript switched on in your browser.</p></noscript>
        <p class="player__loading text-muted" data-loading>Getting your lesson ready…</p>
    </div>

    <div class="container player__guides" data-guides hidden>
        <div data-keyboard></div>
        <div data-hands></div>
    </div>
</div>
<script type="application/json" id="lesson-data"><?= $json($lesson) ?></script>
