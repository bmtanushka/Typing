<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;

final class ApiController
{
    /** GET /api/health – liveness check (no sensitive details). */
    public function health(Request $request): array
    {
        return ['ok' => true, 'app' => config('app.name'), 'time' => date('c')];
    }
}
