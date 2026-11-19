<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Tiny router: exact paths and {param} placeholders.
 *
 * Handlers are [ControllerClass::class, 'method'] or callables. They receive
 * (Request $request, array $params) and return a Response, a string (HTML)
 * or an array (JSON).
 */
final class Router
{
    /** @var list<array{method:string, regex:string, pattern:string, handler:mixed}> */
    private array $routes = [];

    /** @var mixed Handler for unmatched routes. */
    private mixed $notFound = null;

    public function get(string $pattern, mixed $handler): void
    {
        $this->add('GET', $pattern, $handler);
    }

    public function post(string $pattern, mixed $handler): void
    {
        $this->add('POST', $pattern, $handler);
    }

    public function add(string $method, string $pattern, mixed $handler): void
    {
        $quoted = preg_quote($pattern, '#');
        $regex = preg_replace('#\\\\\{([a-zA-Z_][a-zA-Z0-9_]*)\\\\\}#', '(?P<$1>[^/]+)', $quoted);
        $this->routes[] = [
            'method'  => strtoupper($method),
            'regex'   => '#^' . $regex . '$#u',
            'pattern' => $pattern,
            'handler' => $handler,
        ];
    }

    public function setNotFound(mixed $handler): void
    {
        $this->notFound = $handler;
    }

    /**
     * @return array{status:int, handler:mixed, params:array<string,string>, allowed:list<string>}
     */
    public function match(string $method, string $path): array
    {
        $method = $method === 'HEAD' ? 'GET' : strtoupper($method);
        $allowed = [];

        foreach ($this->routes as $route) {
            if (!preg_match($route['regex'], $path, $m)) {
                continue;
            }
            if ($route['method'] !== $method) {
                $allowed[] = $route['method'];
                continue;
            }
            $params = array_filter($m, 'is_string', ARRAY_FILTER_USE_KEY);
            return ['status' => 200, 'handler' => $route['handler'], 'params' => $params, 'allowed' => []];
        }

        if ($allowed !== []) {
            return ['status' => 405, 'handler' => null, 'params' => [], 'allowed' => array_values(array_unique($allowed))];
        }
        return ['status' => 404, 'handler' => null, 'params' => [], 'allowed' => []];
    }

    public function dispatch(Request $request): Response
    {
        $match = $this->match($request->method, $request->path);

        if ($match['status'] === 405) {
            $res = $request->isApi()
                ? Response::json(['ok' => false, 'error' => 'method_not_allowed'], 405)
                : Response::html('Method not allowed', 405);
            return new Response($res->body, 405, $res->headers + ['Allow' => implode(', ', $match['allowed'])]);
        }

        if ($match['status'] === 404) {
            if ($request->isApi()) {
                return Response::json(['ok' => false, 'error' => 'not_found'], 404);
            }
            return $this->notFound !== null
                ? $this->toResponse($this->call($this->notFound, $request, []), 404)
                : Response::html('Not found', 404);
        }

        return $this->toResponse($this->call($match['handler'], $request, $match['params']));
    }

    private function call(mixed $handler, Request $request, array $params): mixed
    {
        if (is_array($handler) && is_string($handler[0] ?? null)) {
            $handler = [new $handler[0](), $handler[1]];
        }
        return $handler($request, $params);
    }

    private function toResponse(mixed $result, int $status = 200): Response
    {
        return match (true) {
            $result instanceof Response => $result,
            is_array($result)           => Response::json($result, $status),
            default                     => Response::html((string) $result, $status),
        };
    }
}
