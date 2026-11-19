<?php
/**
 * Tiny dependency-free PHP test runner.
 * Usage: php tests/run.php
 * Each tests/php/*Test.php file returns an array of name => closure.
 */
declare(strict_types=1);

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

final class AssertionFailed extends RuntimeException {}

function assert_same(mixed $expected, mixed $actual, string $msg = ''): void
{
    if ($expected !== $actual) {
        throw new AssertionFailed(($msg ? "$msg – " : '') . 'expected ' . var_export($expected, true) . ', got ' . var_export($actual, true));
    }
}

function assert_true(bool $cond, string $msg = 'expected true'): void
{
    if (!$cond) {
        throw new AssertionFailed($msg);
    }
}

$passed = 0;
$failed = 0;
foreach (glob(__DIR__ . '/php/*Test.php') as $file) {
    $tests = require $file;
    echo basename($file) . "\n";
    foreach ($tests as $name => $fn) {
        try {
            $fn();
            $passed++;
            echo "  \033[32m✓\033[0m {$name}\n";
        } catch (Throwable $e) {
            $failed++;
            echo "  \033[31m✗ {$name}\033[0m\n    " . $e->getMessage() . "\n";
        }
    }
}
echo "\n{$passed} passed, {$failed} failed\n";
exit($failed > 0 ? 1 : 0);
