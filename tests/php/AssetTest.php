<?php
declare(strict_types=1);

use App\Core\Config;

return [
    'asset URLs carry the version in the path (so ES-module imports inherit it)' => function () {
        Config::set([]);
        $url = asset('js/pages/lesson.js');
        assert_true((bool) preg_match('#^/assets/_v[0-9a-f]{10}/js/pages/lesson\.js$#', $url), $url);
        assert_same(asset_version(), substr(explode('/', $url)[2], 2), 'same version for every asset');
    },
    'version matches the .htaccess rewrite pattern' => function () {
        $htaccess = (string) file_get_contents(KQ_PUBLIC . '/.htaccess');
        assert_true(str_contains($htaccess, 'RewriteRule ^assets/_v[0-9a-f]+/(.+)$ assets/$1 [L]'), 'rewrite rule present');
        assert_true((bool) preg_match('/^[0-9a-f]+$/', asset_version()));
    },
];
