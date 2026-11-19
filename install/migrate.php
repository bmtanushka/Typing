<?php
/**
 * Create / update the database tables from the command line.
 *   php install/migrate.php            (uses config.php or DB_* / MYSQL* environment variables)
 *   php install/migrate.php --wait=30  (retry for up to 30 s while the database starts)
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

define('KQ_ROOT', dirname(__DIR__));
define('KQ_PUBLIC', KQ_ROOT . '/public_html');
spl_autoload_register(static function (string $class): void {
    if (str_starts_with($class, 'App\\')) {
        $file = KQ_ROOT . '/app/' . str_replace('\\', '/', substr($class, 4)) . '.php';
        if (is_file($file)) {
            require $file;
        }
    }
});
require KQ_ROOT . '/app/helpers.php';
App\Core\Config::load(KQ_ROOT . '/config.php');

if (!App\Core\Database::isConfigured()) {
    fwrite(STDERR, "No database configured – skipping migrations.\n");
    exit(0);
}
$wait = 0;
foreach ($argv as $a) {
    if (str_starts_with($a, '--wait=')) {
        $wait = (int) substr($a, 7);
    }
}
$deadline = time() + $wait;
while (true) {
    try {
        $n = App\Services\Migrator::migrate();
        @file_put_contents(App\Services\Migrator::lockFile(), gmdate('c'));
        echo "Database ready ({$n} statements applied).\n";
        exit(0);
    } catch (Throwable $e) {
        if (time() >= $deadline) {
            fwrite(STDERR, 'Migration failed: ' . $e->getMessage() . "\n");
            exit(1);
        }
        sleep(2);
    }
}
