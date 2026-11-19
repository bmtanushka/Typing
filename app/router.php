<?php
/**
 * Route table. Paths are relative to the base path.
 */
declare(strict_types=1);

use App\Controllers\ApiController;
use App\Controllers\ContentController;
use App\Controllers\PageController;
use App\Core\Router;

return static function (Router $r): void {
    // Pages
    $r->get('/', [PageController::class, 'home']);
    $r->get('/styleguide', [PageController::class, 'styleguide']); // dev only
    $r->get('/demo', [PageController::class, 'demo']);
    $r->get('/lessons', [PageController::class, 'lessons']);
    $r->get('/lessons/{id}', [PageController::class, 'lesson']);

    // Sections still to be built – friendly "coming soon" placeholder for now.
    foreach (array_keys(PageController::PLACEHOLDERS) as $path) {
        $r->get($path, [PageController::class, 'placeholder']);
    }

    // JSON API
    $r->get('/api/health', [ApiController::class, 'health']);
    $r->get('/api/layouts/{id}', [ContentController::class, 'layout']);
    $r->get('/api/wordlists/{id}', [ContentController::class, 'wordlist']);
    $r->get('/api/lessons', [ContentController::class, 'lessons']);
    $r->get('/api/lessons/{id}', [ContentController::class, 'lesson']);

    $r->setNotFound([PageController::class, 'notFound']);
};
