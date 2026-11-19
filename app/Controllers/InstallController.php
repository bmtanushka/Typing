<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Csrf;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Core\View;
use App\Services\Logger;
use App\Services\Migrator;

/**
 * One-time web installer for hosts without SSH. Locked (404) once installed.
 */
final class InstallController
{
    private function locked(): bool
    {
        return is_file(Migrator::lockFile());
    }

    public function show(Request $request): Response
    {
        if ($this->locked()) {
            return (new PageController())->notFound($request);
        }
        $status = ['configured' => Database::isConfigured(), 'connected' => false, 'installed' => false, 'error' => null];
        if ($status['configured']) {
            try {
                Database::pdo();
                $status['connected'] = true;
                $status['installed'] = Migrator::isInstalled();
            } catch (\Throwable $e) {
                $status['error'] = 'Could not connect to the database. Check the db settings in config.php.';
                Logger::error('Install: DB connect failed: ' . $e->getMessage());
            }
        }
        return Response::html(View::page('pages/install', [
            'title' => 'Install', 'noindex' => true, 'status' => $status, 'csrf' => Csrf::token(),
            'pageScript' => 'js/pages/install.js', 'pageStyles' => ['css/account.css'],
        ]));
    }

    public function run(Request $request): Response
    {
        if ($this->locked()) {
            return Response::json(['ok' => false, 'error' => 'not_found'], 404);
        }
        if (!Csrf::verify($request)) {
            return Response::json(['ok' => false, 'error' => 'csrf', 'message' => 'Please refresh the page and try again.'], 403);
        }
        try {
            $n = Migrator::migrate();
            file_put_contents(Migrator::lockFile(), gmdate('c'));
            return Response::json(['ok' => true, 'message' => "Done – {$n} tables checked or created. This installer is now locked."]);
        } catch (\Throwable $e) {
            Logger::error('Install failed: ' . $e->getMessage());
            return Response::json(['ok' => false, 'error' => 'failed', 'message' => 'Installation failed – see storage/logs for details.'], 500);
        }
    }
}
