<?php
/**
 * KeyQuest configuration – SAMPLE.
 *
 * Copy to config.php (same folder, i.e. OUTSIDE public_html) and edit.
 * config.php is git-ignored and must never be committed.
 */
return [
    'app' => [
        'name'      => 'KeyQuest',
        // 'development' enables /styleguide and detailed errors; use 'production' live.
        'env'       => 'development',
        'debug'     => true,
        // null = auto-detect from the script location (works at root or in a subfolder).
        // Set explicitly e.g. '/typing' if auto-detection is wrong. No trailing slash.
        'base_path' => null,
        // Absolute URL used in e-mails (password reset links).
        'base_url'  => 'http://localhost:8000',
        'timezone'  => 'Europe/London',
    ],

    'db' => [
        // On Hostinger use 127.0.0.1 or localhost (NOT the srvNNNN.hstgr.io remote host).
        'host'    => '127.0.0.1',
        'port'    => 3306,
        'name'    => 'keyquest',
        'user'    => 'keyquest',
        'pass'    => '',
        'charset' => 'utf8mb4',
    ],

    'mail' => [
        // 'mail' = PHP mail(), 'smtp' = SMTP below, 'log' = write mails to storage/logs (dev).
        'driver'     => 'log',
        'from_email' => 'no-reply@example.com',
        'from_name'  => 'KeyQuest',
        'smtp' => [
            'host'       => 'smtp.hostinger.com',
            'port'       => 465,
            'encryption' => 'ssl', // ssl | tls
            'username'   => '',
            'password'   => '',
        ],
    ],

    'security' => [
        // Set true in production once HTTPS works (secure cookies + redirect).
        'force_https' => false,
        // true only behind a reverse proxy you trust (e.g. Railway) – uses X-Forwarded-For/Proto.
        'trust_proxy' => false,
    ],
];
