<?php
/**
 * Route table. Paths are relative to the base path.
 */
declare(strict_types=1);

use App\Controllers\ApiController;
use App\Controllers\PageController;
use App\Core\Router;

return static function (Router $r): void {
    // Pages
    $r->get('/', [PageController::class, 'home']);
    $r->get('/styleguide', [PageController::class, 'styleguide']); // dev only

    // Sections still to be built – friendly "coming soon" placeholder for now.
    foreach (array_keys(PageController::PLACEHOLDERS) as $path) {
        $r->get($path, [PageController::class, 'placeholder']);
    }

    // JSON API
    $r->get('/api/health', [ApiController::class, 'health']);

    $r->setNotFound([PageController::class, 'notFound']);
};
