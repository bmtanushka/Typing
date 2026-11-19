<?php
/**
 * API integration tests – run against a live server with a database:
 *   php tests/integration/api.php http://localhost:8090
 * Creates throw-away users (unique emails) and deletes them at the end.
 */
declare(strict_types=1);

$base = rtrim($argv[1] ?? 'http://localhost:8000', '/');
$passed = 0;
$failed = 0;

final class Client
{
    public array $cookies = [];
    public ?string $csrf = null;

    public function __construct(private string $base) {}

    public function req(string $method, string $path, ?array $body = null, array $headers = []): array
    {
        $ch = curl_init($this->base . $path);
        $h = ['Accept: application/json'];
        if ($body !== null) {
            $h[] = 'Content-Type: application/json';
        }
        if ($this->csrf && $method === 'POST' && !array_key_exists('csrf', $headers)) {
            $h[] = 'X-CSRF-Token: ' . $this->csrf;
        }
        if (isset($headers['csrf']) && $headers['csrf'] !== null) {
            $h[] = 'X-CSRF-Token: ' . $headers['csrf'];
        }
        if ($this->cookies) {
            $h[] = 'Cookie: ' . implode('; ', array_map(fn ($k, $v) => "$k=$v", array_keys($this->cookies), $this->cookies));
        }
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method, CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => true,
            CURLOPT_HTTPHEADER => $h, CURLOPT_POSTFIELDS => $body !== null ? json_encode($body) : null,
        ]);
        $raw = (string) curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $hs = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        curl_close($ch);
        $head = substr($raw, 0, $hs);
        preg_match_all('/^Set-Cookie:\s*([^=]+)=([^;]*)/mi', $head, $m, PREG_SET_ORDER);
        foreach ($m as [, $k, $v]) {
            if ($v === '' || $v === 'deleted') {
                unset($this->cookies[$k]);
            } else {
                $this->cookies[$k] = $v;
            }
        }
        $json = json_decode(substr($raw, $hs), true) ?? [];
        if (isset($json['csrf'])) {
            $this->csrf = $json['csrf'];
        }
        return ['status' => $status, 'json' => $json, 'headers' => $head];
    }

    public function get(string $p): array { return $this->req('GET', $p); }
    public function post(string $p, array $b = [], array $h = []): array { return $this->req('POST', $p, $b, $h); }
}

function t(string $name, callable $fn): void
{
    global $passed, $failed;
    try {
        $fn();
        $passed++;
        echo "  \033[32m✓\033[0m {$name}\n";
    } catch (Throwable $e) {
        $failed++;
        echo "  \033[31m✗ {$name}\033[0m\n    {$e->getMessage()}\n";
    }
}
function check(bool $c, string $msg): void
{
    if (!$c) {
        throw new RuntimeException($msg);
    }
}

$email = 'test+' . bin2hex(random_bytes(4)) . '@example.com';
$pass = 'correct horse battery';
$a = new Client($base);
$day = gmdate('Y-m-d');
$ev = fn (array $o = []) => $o + ['id' => bin2hex(random_bytes(8)), 'type' => 'lesson', 'ref' => 'hr-fj', 'at' => gmdate('c'), 'day' => $day,
    'wpm' => 20, 'rawWpm' => 22, 'accuracy' => 96, 'durationMs' => 60000, 'chars' => 110, 'stars' => 2, 'xp' => 40,
    'keyStats' => ['f' => ['attempts' => 10, 'errors' => 1, 'latencyTotal' => 2000, 'latencyCount' => 9]], 'badges' => ['first-steps'], 'skipped' => []];

echo "API integration ({$base})\n";

t('session issues a CSRF token, no user', function () use ($a) {
    $r = $a->get('/api/session');
    check($r['status'] === 200 && $r['json']['user'] === null && strlen($r['json']['csrf']) === 64, json_encode($r['json']));
});
t('POST without CSRF token is refused', function () use ($a, $email, $pass) {
    $r = $a->post('/api/auth/register', ['displayName' => 'X', 'email' => $email, 'password' => $pass], ['csrf' => 'nope']);
    check($r['status'] === 403, 'status ' . $r['status']);
});
t('register validates input', function () use ($a) {
    $r = $a->post('/api/auth/register', ['displayName' => '', 'email' => 'bad', 'password' => 'short']);
    check($r['status'] === 422 && isset($r['json']['fields']['email'], $r['json']['fields']['password'], $r['json']['fields']['displayName']), json_encode($r['json']));
});
t('register creates the account and signs in', function () use ($a, $email, $pass) {
    $old = $a->cookies['kq_session'] ?? '';
    $r = $a->post('/api/auth/register', ['displayName' => '  Sam  ', 'email' => strtoupper($email), 'password' => $pass]);
    check($r['status'] === 201 && $r['json']['user']['displayName'] === 'Sam' && $r['json']['user']['email'] === $email, json_encode($r['json']));
    check(!isset($r['json']['user']['password_hash']), 'no hash leaked');
    check(($a->cookies['kq_session'] ?? '') !== $old, 'session id regenerated');
    check(stripos($r['headers'], 'HttpOnly') !== false && stripos($r['headers'], 'SameSite=Lax') !== false, 'cookie flags');
});
t('duplicate email is refused kindly', function () use ($email, $pass, $base) {
    $b = new Client($base);
    $b->get('/api/session');
    $r = $b->post('/api/auth/register', ['displayName' => 'Twin', 'email' => $email, 'password' => $pass]);
    check($r['status'] === 422 && str_contains($r['json']['fields']['email'] ?? '', 'already'), json_encode($r['json']));
});
t('sync applies events once (idempotent) and returns state', function () use ($a, $ev) {
    $e = $ev();
    $r = $a->post('/api/progress/sync', ['events' => [$e, $e]]);
    check($r['status'] === 200 && in_array($e['id'], $r['json']['accepted'], true), json_encode($r['json']));
    $r2 = $a->post('/api/progress/sync', ['events' => [$e]]);
    $s = $r2['json']['state'];
    check($s['progress']['hr-fj']['stars'] === 2 && $s['progress']['hr-fj']['attempts'] === 1, 'progress ' . json_encode($s['progress']));
    check($s['xp'] === 40 && $s['keyStats']['f']['attempts'] === 10 && isset($s['badges']['first-steps']), 'xp/keys/badges');
    check($s['streak']['current'] === 1 && count($s['results']) === 1, 'streak/results');
});
t('best result kept; failed attempt adds an attempt only', function () use ($a, $ev) {
    $r = $a->post('/api/progress/sync', ['events' => [$ev(['stars' => 0, 'wpm' => 30, 'accuracy' => 70, 'xp' => 10])]]);
    $p = $r['json']['state']['progress']['hr-fj'];
    check($p['stars'] === 2 && (float) $p['bestWpm'] === 20.0 && $p['attempts'] === 2, json_encode($p));
});
t('implausible results are rejected', function () use ($a, $ev) {
    $fast = $ev(['wpm' => 900]);
    $tooMany = $ev(['chars' => 5000, 'durationMs' => 10000]);
    $badRef = $ev(['ref' => '../etc']);
    $r = $a->post('/api/progress/sync', ['events' => [$fast, $tooMany, $badRef]]);
    check(count($r['json']['rejected']) === 3 && $r['json']['accepted'] === [], json_encode($r['json']));
});
t('settings and skipped lessons sync', function () use ($a) {
    $r = $a->post('/api/progress/sync', ['events' => [], 'skipped' => ['gs-welcome', 'BAD!'], 'settings' => ['theme' => 'dark', 'sound' => true, 'evil' => 'x', 'layout' => 'fr']]);
    $s = $r['json']['state'];
    check(($s['skipped']['gs-welcome'] ?? false) === true && !isset($s['skipped']['BAD!']), json_encode($s['skipped']));
    check($s['settings'] === ['theme' => 'dark', 'sound' => true], json_encode($s['settings']));
});
t('logout ends the session', function () use ($a) {
    check($a->post('/api/auth/logout')['status'] === 200, 'logout');
    $r = $a->get('/api/progress');
    check($r['status'] === 401, 'status ' . $r['status']);
});
t('login: wrong password is refused, right one works', function () use ($a, $email, $pass) {
    $a->get('/api/session');
    $r = $a->post('/api/auth/login', ['email' => $email, 'password' => 'wrong password']);
    check($r['status'] === 401 && !str_contains(strtolower($r['json']['message']), 'no account'), json_encode($r['json']));
    $r = $a->post('/api/auth/login', ['email' => $email, 'password' => $pass]);
    check($r['status'] === 200 && $r['json']['user']['email'] === $email, json_encode($r['json']));
});
t('guest merge: best per lesson, sum XP, union badges – only once', function () use ($a) {
    $guest = ['progress' => ['hr-fj' => ['stars' => 3, 'bestWpm' => 25, 'bestAccuracy' => 99, 'attempts' => 2, 'completedAt' => gmdate('c')],
        'hr-dk' => ['stars' => 1, 'bestWpm' => 12, 'bestAccuracy' => 88, 'attempts' => 1]],
        'results' => [['type' => 'lesson', 'ref' => 'hr-dk', 'wpm' => 12, 'rawWpm' => 13, 'accuracy' => 88, 'durationMs' => 50000, 'chars' => 60, 'stars' => 1, 'at' => gmdate('c')]],
        'keyStats' => ['f' => ['attempts' => 5, 'errors' => 0, 'latencyTotal' => 0, 'latencyCount' => 0]],
        'badges' => ['hat-trick' => gmdate('c'), 'made-up' => gmdate('c')], 'xp' => 100,
        'streak' => ['current' => 3, 'best' => 5, 'lastDay' => gmdate('Y-m-d')], 'skipped' => [], 'gameScores' => ['key-drops' => 120]];
    $id = '11111111-2222-4333-8444-' . substr(bin2hex(random_bytes(6)), 0, 12);
    $r = $a->post('/api/progress/merge', ['mergeId' => $id, 'guest' => $guest]);
    $s = $r['json']['state'];
    check($r['json']['merged'] === true, 'merged');
    check($s['progress']['hr-fj']['stars'] === 3 && (float) $s['progress']['hr-fj']['bestWpm'] === 25.0, json_encode($s['progress']['hr-fj']));
    check($s['xp'] === 150 && isset($s['badges']['hat-trick'], $s['badges']['first-steps']) && !isset($s['badges']['made-up']), 'xp/badges ' . $s['xp']);
    check($s['keyStats']['f']['attempts'] === 25 && $s['streak']['current'] === 3 && $s['streak']['best'] === 5 && $s['gameScores']['key-drops'] === 120, 'keys/streak/games');
    $again = $a->post('/api/progress/merge', ['mergeId' => $id, 'guest' => $guest]);
    check($again['json']['merged'] === false && $again['json']['state']['xp'] === 150, 'second merge is a no-op');
});
t('profile and password changes', function () use ($a, $email, $pass) {
    $r = $a->post('/api/account/profile', ['displayName' => 'Sam T', 'email' => $email]);
    check($r['json']['ok'] === true && $r['json']['user']['displayName'] === 'Sam T', json_encode($r['json']));
    $r = $a->post('/api/account/password', ['current' => 'nope nope', 'password' => 'new password 1']);
    check($r['status'] === 422, 'wrong current refused');
    $r = $a->post('/api/account/password', ['current' => $pass, 'password' => 'new password 1']);
    check($r['json']['ok'] === true, 'changed');
});
t('export downloads JSON with no password hash', function () use ($a) {
    $r = $a->get('/api/account/export');
    check($r['status'] === 200 && str_contains($r['headers'], 'attachment') && isset($r['json']['progress']['xp']), 'export');
    check(!str_contains(json_encode($r['json']), 'argon') && !str_contains(json_encode($r['json']), 'password_hash'), 'no hash');
});
t('forgot password never reveals whether an email exists', function () use ($base, $email) {
    $c = new Client($base);
    $c->get('/api/session');
    $x = $c->post('/api/auth/forgot', ['email' => $email]);
    $y = $c->post('/api/auth/forgot', ['email' => 'nobody-' . bin2hex(random_bytes(3)) . '@example.com']);
    check($x['status'] === 200 && $y['status'] === 200 && $x['json']['message'] === $y['json']['message'], 'same response');
});
t('reset rejects a bad token', function () use ($base) {
    $c = new Client($base);
    $c->get('/api/session');
    $r = $c->post('/api/auth/reset', ['token' => str_repeat('a', 64), 'password' => 'whatever123']);
    check($r['status'] === 400, 'status ' . $r['status']);
});
t('login is rate limited after repeated failures', function () use ($base, $email) {
    $c = new Client($base);
    $c->get('/api/session');
    $codes = [];
    for ($i = 0; $i < 7; $i++) {
        $codes[] = $c->post('/api/auth/login', ['email' => $email, 'password' => 'bad guess ' . $i])['status'];
    }
    check(in_array(429, $codes, true), implode(',', $codes));
});
t('delete account needs the password and removes everything', function () use ($a) {
    check($a->post('/api/account/delete', ['password' => 'wrong one'])['status'] === 422, 'wrong password refused');
    $r = $a->post('/api/account/delete', ['password' => 'new password 1']);
    check($r['json']['ok'] === true, json_encode($r['json']));
    check($a->get('/api/progress')['status'] === 401, 'signed out');
});

echo "\n{$passed} passed, {$failed} failed\n";
exit($failed ? 1 : 0);
