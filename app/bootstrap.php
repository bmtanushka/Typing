<?php
/**
 * Application bootstrap: autoloading, config, error handling, dispatch.
 * Expects KQ_ROOT and KQ_PUBLIC to be defined by the front controller.
 */
declare(strict_types=1);

use App\Core\Config;
use App\Core\ErrorHandler;
use App\Core\Request;
use App\Core\Router;
use App\Core\Response;

// --- Autoloader: App\Foo\Bar -> app/Foo/Bar.php -------------------------
spl_autoload_register(static function (string $class): void {
    if (!str_starts_with($class, 'App\\')) {
        return;
    }
    $file = KQ_ROOT . '/app/' . str_replace('\\', '/', substr($class, 4)) . '.php';
    if (is_file($file)) {
        require $file;
    }
});

require KQ_ROOT . '/app/helpers.php';

// --- Configuration --------------------------------------------------------
Config::load(KQ_ROOT . '/config.php');
date_default_timezone_set((string) Config::get('app.timezone', 'Europe/London'));

// --- Errors: log everything, show details only in debug -------------------
ErrorHandler::register(
    debug: (bool) Config::get('app.debug', false),
    logDir: KQ_ROOT . '/storage/logs'
);

// --- Dispatch ---------------------------------------------------------------
$request = Request::fromGlobals((string) base_path());

$router = new Router();
(require KQ_ROOT . '/app/router.php')($router);

$response = $router->dispatch($request);
send_security_headers();
$response->send();
