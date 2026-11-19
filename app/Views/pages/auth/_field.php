<?php
/** @var string $name @var string $label @var string $type @var string $autocomplete @var ?string $hint @var ?string $value */
$id = 'f-' . $name;
?>
<div class="field" data-field="<?= e($name) ?>">
    <label class="field__label" for="<?= e($id) ?>"><?= e($label) ?></label>
    <input class="input" id="<?= e($id) ?>" name="<?= e($name) ?>" type="<?= e($type) ?>" autocomplete="<?= e($autocomplete) ?>"
           value="<?= e($value ?? '') ?>" <?= !empty($required) ? 'required' : '' ?> <?= !empty($minlength) ? 'minlength="' . (int) $minlength . '"' : '' ?>
           aria-describedby="<?= e($id) ?>-error<?= !empty($hint) ? ' ' . e($id) . '-hint' : '' ?>">
    <?php if (!empty($hint)): ?><p class="field__hint" id="<?= e($id) ?>-hint"><?= e($hint) ?></p><?php endif; ?>
    <p class="field__error" id="<?= e($id) ?>-error" data-error hidden></p>
</div>
