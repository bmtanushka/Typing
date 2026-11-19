<?php
/**
 * Pip – the KeyQuest mascot: a friendly little keycap.
 * @var ?int    $size  Pixel width (default 120)
 * @var ?string $mood  happy | cheer | think
 * @var ?string $label Accessible label (decorative if empty)
 */
$size  = (int) ($size ?? 120);
$mood  = $mood ?? 'happy';
$label = $label ?? '';
?>
<svg class="mascot mascot--<?= e($mood) ?>" width="<?= $size ?>" height="<?= (int) round($size * 1.08) ?>"
     viewBox="0 0 120 130" <?= $label !== '' ? 'role="img" aria-label="' . e($label) . '"' : 'aria-hidden="true"' ?>>
    <!-- shadow -->
    <ellipse cx="60" cy="123" rx="34" ry="5" fill="currentColor" opacity=".12"/>
    <!-- feet -->
    <rect x="36" y="108" width="16" height="12" rx="6" class="m-dark"/>
    <rect x="68" y="108" width="16" height="12" rx="6" class="m-dark"/>
    <?php if ($mood === 'cheer'): ?>
        <!-- arms up -->
        <path d="M18 64 6 40M102 64l12-24" class="m-dark-stroke" stroke-width="8" stroke-linecap="round"/>
    <?php else: ?>
        <path d="M18 70 8 84M102 70l10 14" class="m-dark-stroke" stroke-width="8" stroke-linecap="round"/>
    <?php endif; ?>
    <!-- keycap body -->
    <rect x="14" y="22" width="92" height="90" rx="22" class="m-dark"/>
    <rect x="14" y="16" width="92" height="84" rx="22" class="m-main"/>
    <rect x="24" y="22" width="72" height="62" rx="16" class="m-light"/>
    <!-- home-row bump -->
    <rect x="50" y="76" width="20" height="4" rx="2" class="m-main" opacity=".7"/>
    <!-- eyes -->
    <?php if ($mood === 'cheer'): ?>
        <path d="M38 50q6-8 12 0M70 50q6-8 12 0" fill="none" stroke="#1e1b2e" stroke-width="4" stroke-linecap="round"/>
    <?php else: ?>
        <circle cx="44" cy="48" r="7" fill="#1e1b2e"/>
        <circle cx="76" cy="48" r="7" fill="#1e1b2e"/>
        <circle cx="46.5" cy="45.5" r="2.4" fill="#fff"/>
        <circle cx="78.5" cy="45.5" r="2.4" fill="#fff"/>
    <?php endif; ?>
    <!-- cheeks -->
    <circle cx="33" cy="60" r="5" class="m-accent" opacity=".45"/>
    <circle cx="87" cy="60" r="5" class="m-accent" opacity=".45"/>
    <!-- mouth -->
    <?php if ($mood === 'think'): ?>
        <path d="M52 64h16" stroke="#1e1b2e" stroke-width="4" stroke-linecap="round"/>
    <?php else: ?>
        <path d="M48 60q12 12 24 0" fill="<?= $mood === 'cheer' ? '#1e1b2e' : 'none' ?>" stroke="#1e1b2e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <?php endif; ?>
    <?php if ($mood === 'think'): ?>
        <circle cx="104" cy="14" r="4" class="m-light"/>
        <circle cx="112" cy="5" r="2.5" class="m-light"/>
    <?php endif; ?>
</svg>
