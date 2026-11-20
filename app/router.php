<?php
/**
 * Route table. Paths are relative to the base path.
 */
declare(strict_types=1);

use App\Controllers\AccountController;
use App\Controllers\ApiController;
use App\Controllers\AuthController;
use App\Controllers\InstallController;
use App\Controllers\ProgressController;
use App\Controllers\ContentController;
use App\Controllers\PageController;
use App\Core\Router;

return static function (Router $r): void {
    // Pages
    $r->get('/', [PageController::class, 'home']);
    $r->get('/styleguide', [PageController::class, 'styleguide']); // dev only
    $r->get('/demo', [PageController::class, 'demo']); // playground → redirects to /practice
    $r->get('/practice', [PageController::class, 'practice']);
    $r->get('/test', [PageController::class, 'typingTest']);
    $r->get('/placement', [PageController::class, 'placement']);
    $r->get('/lessons', [PageController::class, 'lessons']);
    $r->get('/lessons/{id}', [PageController::class, 'lesson']);
    $r->get('/badges', [PageController::class, 'badges']);
    $r->get('/settings', [PageController::class, 'settings']);
    $r->get('/progress', [PageController::class, 'progress']);
    $r->get('/login', [PageController::class, 'login']);
    $r->get('/register', [PageController::class, 'register']);
    $r->get('/forgot-password', [PageController::class, 'forgot']);
    $r->get('/reset-password', [PageController::class, 'reset']);
    $r->get('/account', [PageController::class, 'account']);
    $r->get('/setup', [InstallController::class, 'show']);
    $r->post('/setup', [InstallController::class, 'run']);

    // Sections still to be built – friendly "coming soon" placeholder for now.
    foreach (array_keys(PageController::PLACEHOLDERS) as $path) {
        $r->get($path, [PageController::class, 'placeholder']);
    }

    // JSON API
    $r->get('/api/health', [ApiController::class, 'health']);
    $r->get('/api/layouts/{id}', [ContentController::class, 'layout']);
    $r->get('/api/wordlists/{id}', [ContentController::class, 'wordlist']);
    $r->get('/api/lessons', [ContentController::class, 'lessons']);
    $r->get('/api/badges', [ContentController::class, 'badges']);
    $r->get('/api/texts/{id}', [ContentController::class, 'texts']);

    // Accounts + sync (JSON, CSRF-protected POSTs)
    $r->get('/api/session', [AuthController::class, 'session']);
    $r->post('/api/auth/register', [AuthController::class, 'register']);
    $r->post('/api/auth/login', [AuthController::class, 'login']);
    $r->post('/api/auth/logout', [AuthController::class, 'logout']);
    $r->post('/api/auth/forgot', [AuthController::class, 'forgot']);
    $r->post('/api/auth/reset', [AuthController::class, 'reset']);
    $r->get('/api/progress', [ProgressController::class, 'show']);
    $r->post('/api/progress/sync', [ProgressController::class, 'sync']);
    $r->post('/api/progress/merge', [ProgressController::class, 'merge']);
    $r->post('/api/account/profile', [AccountController::class, 'profile']);
    $r->post('/api/account/password', [AccountController::class, 'password']);
    $r->post('/api/account/delete', [AccountController::class, 'delete']);
    $r->get('/api/account/export', [AccountController::class, 'export']);
    $r->get('/api/lessons/{id}', [ContentController::class, 'lesson']);

    $r->setNotFound([PageController::class, 'notFound']);
};
