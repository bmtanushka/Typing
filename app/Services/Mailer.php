<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Config;

/**
 * Pluggable plain-text mailer. Driver from config mail.driver:
 *   log  – write to storage/logs/mail.log (development / testing)
 *   mail – PHP mail() (works on most Hostinger plans)
 *   smtp – minimal SMTP client (SSL on 465 or STARTTLS on 587) with AUTH LOGIN
 */
final class Mailer
{
    public static function send(string $to, string $subject, string $body): bool
    {
        $driver = (string) Config::get('mail.driver', 'log');
        $fromEmail = (string) Config::get('mail.from_email', 'no-reply@example.com');
        $fromName = (string) Config::get('mail.from_name', (string) Config::get('app.name', 'KeyQuest'));
        // Header injection guard.
        foreach ([$to, $subject, $fromEmail, $fromName] as $v) {
            if (preg_match('/[\r\n]/', $v)) {
                return false;
            }
        }
        try {
            return match ($driver) {
                'mail' => self::viaMail($to, $subject, $body, $fromEmail, $fromName),
                'smtp' => self::viaSmtp($to, $subject, $body, $fromEmail, $fromName),
                default => self::viaLog($to, $subject, $body),
            };
        } catch (\Throwable $e) {
            Logger::error('Mail failed: ' . $e->getMessage(), ['driver' => $driver]);
            return false;
        }
    }

    private static function headers(string $fromEmail, string $fromName): array
    {
        return [
            'From' => sprintf('%s <%s>', mb_encode_mimeheader($fromName, 'UTF-8'), $fromEmail),
            'Reply-To' => $fromEmail,
            'MIME-Version' => '1.0',
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Content-Transfer-Encoding' => '8bit',
        ];
    }

    private static function viaLog(string $to, string $subject, string $body): bool
    {
        $line = sprintf("=== %s\nTo: %s\nSubject: %s\n\n%s\n\n", date('c'), $to, $subject, $body);
        return @file_put_contents(KQ_ROOT . '/storage/logs/mail.log', $line, FILE_APPEND | LOCK_EX) !== false;
    }

    private static function viaMail(string $to, string $subject, string $body, string $fromEmail, string $fromName): bool
    {
        return mail($to, mb_encode_mimeheader($subject, 'UTF-8'), $body, self::headers($fromEmail, $fromName), '-f' . $fromEmail);
    }

    private static function viaSmtp(string $to, string $subject, string $body, string $fromEmail, string $fromName): bool
    {
        $c = (array) Config::get('mail.smtp', []);
        $host = (string) ($c['host'] ?? '');
        $port = (int) ($c['port'] ?? 465);
        $enc = (string) ($c['encryption'] ?? 'ssl');
        $remote = ($enc === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;
        $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true]]);
        $fp = @stream_socket_client($remote, $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $ctx);
        if (!$fp) {
            throw new \RuntimeException("SMTP connect failed: {$errstr}");
        }
        stream_set_timeout($fp, 10);
        $read = static function () use ($fp): string {
            $out = '';
            while (($line = fgets($fp, 515)) !== false) {
                $out .= $line;
                if (isset($line[3]) && $line[3] === ' ') {
                    break;
                }
            }
            return $out;
        };
        $cmd = static function (string $line, array $ok) use ($fp, $read): string {
            fwrite($fp, $line . "\r\n");
            $res = $read();
            if (!in_array((int) substr($res, 0, 3), $ok, true)) {
                throw new \RuntimeException('SMTP error: ' . trim($res));
            }
            return $res;
        };
        $read();
        $ehloHost = parse_url((string) Config::get('app.base_url', ''), PHP_URL_HOST) ?: 'localhost';
        $cmd("EHLO {$ehloHost}", [250]);
        if ($enc === 'tls') {
            $cmd('STARTTLS', [220]);
            if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new \RuntimeException('STARTTLS failed');
            }
            $cmd("EHLO {$ehloHost}", [250]);
        }
        if (($c['username'] ?? '') !== '') {
            $cmd('AUTH LOGIN', [334]);
            $cmd(base64_encode((string) $c['username']), [334]);
            $cmd(base64_encode((string) ($c['password'] ?? '')), [235]);
        }
        $cmd("MAIL FROM:<{$fromEmail}>", [250]);
        $cmd("RCPT TO:<{$to}>", [250, 251]);
        $cmd('DATA', [354]);
        $headers = self::headers($fromEmail, $fromName) + [
            'To' => $to,
            'Subject' => mb_encode_mimeheader($subject, 'UTF-8'),
            'Date' => date('r'),
            'Message-ID' => sprintf('<%s@%s>', bin2hex(random_bytes(8)), $ehloHost),
        ];
        $msg = '';
        foreach ($headers as $k => $v) {
            $msg .= "{$k}: {$v}\r\n";
        }
        $body = str_replace(["\r\n", "\r"], "\n", $body);
        $body = (string) preg_replace('/^\./m', '..', $body); // dot-stuffing
        $msg .= "\r\n" . str_replace("\n", "\r\n", $body) . "\r\n.";
        $cmd($msg, [250]);
        $cmd('QUIT', [221]);
        fclose($fp);
        return true;
    }
}
