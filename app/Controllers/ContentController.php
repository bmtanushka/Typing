<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;

/**
 * Serves read-only JSON content from /content (outside the web root).
 */
final class ContentController
{
    /** GET /api/layouts/{id} */
    public function layout(Request $request, array $params): Response
    {
        return $this->json('layouts', $params['id'] ?? '', $request);
    }

    private function json(string $folder, string $id, Request $request): Response
    {
        // Strict whitelist: lowercase slug only – no path traversal possible.
        if (!preg_match('/^[a-z0-9][a-z0-9-]{0,63}$/', $id)) {
            return Response::json(['ok' => false, 'error' => 'invalid_id'], 400);
        }
        $file = KQ_ROOT . "/content/{$folder}/{$id}.json";
        if (!is_file($file)) {
            return Response::json(['ok' => false, 'error' => 'not_found'], 404);
        }

        $etag = '"' . md5_file($file) . '"';
        $headers = [
            'Content-Type'  => 'application/json; charset=UTF-8',
            'Cache-Control' => 'public, max-age=3600',
            'ETag'          => $etag,
        ];
        if (trim((string) ($request->server['HTTP_IF_NONE_MATCH'] ?? '')) === $etag) {
            return new Response('', 304, $headers);
        }
        return new Response((string) file_get_contents($file), 200, $headers);
    }
}
