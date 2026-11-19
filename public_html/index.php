<?php
/**
 * KeyQuest front controller.
 *
 * Every request that is not a real file is routed here (see .htaccess).
 * The application code normally lives one level above the web root;
 * if the host forces everything inside public_html we fall back to that.
 */
declare(strict_types=1);

define('KQ_START', microtime(true));
define('KQ_PUBLIC', __DIR__);
define('KQ_ROOT', is_dir(dirname(__DIR__) . '/app') ? dirname(__DIR__) : __DIR__);

require KQ_ROOT . '/app/bootstrap.php';
