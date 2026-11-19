<?php
declare(strict_types=1);

use App\Core\Config;

return [
    'environment variables override config file' => function () {
        putenv('APP_ENV=development');
        putenv('APP_DEBUG=false');
        putenv('MYSQLPORT=3307');
        putenv('MYSQLPASSWORD=12345');
        Config::load('/nonexistent/config.php');
        assert_same('development', Config::get('app.env'));
        assert_same(false, Config::get('app.debug'));
        assert_same(3307, Config::get('db.port'));
        assert_same('12345', Config::get('db.pass'), 'passwords stay strings');
        putenv('APP_ENV'); putenv('APP_DEBUG'); putenv('MYSQLPORT'); putenv('MYSQLPASSWORD');
    },
    'defaults are production-safe without config' => function () {
        Config::load('/nonexistent/config.php');
        assert_same('production', Config::get('app.env'));
        assert_same(false, Config::get('app.debug'));
    },
];
