<?php
declare(strict_types=1);

use App\Core\Request;
use App\Core\Router;

return [
    'normalises paths at domain root' => function () {
        assert_same('/', Request::normalisePath('/', ''));
        assert_same('/lessons', Request::normalisePath('/lessons/', ''));
        assert_same('/lessons', Request::normalisePath('/lessons?x=1', ''));
        assert_same('/a/b', Request::normalisePath('//a///b/', ''));
    },
    'strips a subfolder base path' => function () {
        assert_same('/', Request::normalisePath('/typing', '/typing'));
        assert_same('/', Request::normalisePath('/typing/', '/typing'));
        assert_same('/lessons', Request::normalisePath('/typing/lessons', '/typing'));
        assert_same('/typingtest', Request::normalisePath('/typingtest', '/typing'), 'must not strip partial segment');
    },
    'matches static and parameter routes' => function () {
        $r = new Router();
        $r->get('/', 'home');
        $r->get('/lessons/{id}', 'lesson');
        $m = $r->match('GET', '/lessons/home-fj');
        assert_same(200, $m['status']);
        assert_same('lesson', $m['handler']);
        assert_same(['id' => 'home-fj'], $m['params']);
        assert_same(200, $r->match('HEAD', '/')['status'], 'HEAD behaves like GET');
    },
    'returns 404 and 405 correctly' => function () {
        $r = new Router();
        $r->post('/api/login', 'login');
        assert_same(404, $r->match('GET', '/nope')['status']);
        $m = $r->match('GET', '/api/login');
        assert_same(405, $m['status']);
        assert_same(['POST'], $m['allowed']);
    },
    'regex characters in patterns are literal' => function () {
        $r = new Router();
        $r->get('/a.b', 'dot');
        assert_same(404, $r->match('GET', '/aXb')['status']);
        assert_same(200, $r->match('GET', '/a.b')['status']);
    },
    'dispatch converts arrays to JSON' => function () {
        $r = new Router();
        $r->get('/api/x', fn () => ['ok' => true]);
        $res = $r->dispatch(new Request('GET', '/api/x'));
        assert_same(200, $res->status);
        assert_same('{"ok":true}', $res->body);
        $res = $r->dispatch(new Request('GET', '/api/missing'));
        assert_same(404, $res->status);
    },
    'escapes HTML' => function () {
        assert_same('&lt;script&gt;&quot;x&quot;&apos;', e('<script>"x"\''));
    },
];
