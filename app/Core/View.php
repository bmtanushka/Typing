<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Plain-PHP templates. Views live in app/Views and are rendered with
 * extracted variables. Always escape output with e().
 */
final class View
{
    public static function render(string $view, array $data = []): string
    {
        $file = KQ_ROOT . '/app/Views/' . $view . '.php';
        if (!is_file($file)) {
            throw new \RuntimeException("View not found: {$view}");
        }
        return (static function (string $__file, array $__data): string {
            extract($__data, EXTR_SKIP);
            ob_start();
            try {
                require $__file;
                return (string) ob_get_clean();
            } catch (\Throwable $e) {
                ob_end_clean();
                throw $e;
            }
        })($file, $data);
    }

    /** Render a page view inside the main layout. */
    public static function page(string $view, array $data = []): string
    {
        $data['content'] = self::render($view, $data);
        return self::render('layout', $data);
    }
}
