<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\LessonRepository;

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

    /** GET /api/wordlists/{id} */
    public function texts(Request $request, array $params): Response
    {
        return $this->json('texts', $params['id'] ?? '', $request);
    }

    public function wordlist(Request $request, array $params): Response
    {
        return $this->json('wordlists', $params['id'] ?? '', $request);
    }

    /** GET /api/badges */
    public function badges(Request $request): Response
    {
        $file = KQ_ROOT . '/content/badges.json';
        return $this->cached($request, '"' . md5_file($file) . '"', static fn () => (string) file_get_contents($file));
    }

    /** GET /api/lessons – course index (units + lesson summaries). */
    public function lessons(Request $request): Response
    {
        $repo = new LessonRepository();
        return $this->cached($request, '"' . $repo->version() . '"', static fn () => json_encode(
            $repo->index(),
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
        ));
    }

    /** GET /api/lessons/{id} */
    public function lesson(Request $request, array $params): Response
    {
        return $this->json('lessons', $params['id'] ?? '', $request);
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

        return $this->cached($request, '"' . md5_file($file) . '"', static fn () => (string) file_get_contents($file));
    }

    /** JSON response with ETag revalidation (content changes on deploy). */
    private function cached(Request $request, string $etag, callable $body): Response
    {
        $headers = [
            'Content-Type'  => 'application/json; charset=UTF-8',
            'Cache-Control' => 'public, max-age=300, must-revalidate',
            'ETag'          => $etag,
        ];
        if (trim((string) ($request->server['HTTP_IF_NONE_MATCH'] ?? '')) === $etag) {
            return new Response('', 304, $headers);
        }
        return new Response($body(), 200, $headers);
    }
}
