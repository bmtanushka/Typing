# Deploying KeyQuest to Hostinger

This guide takes you from an empty Hostinger website to a working KeyQuest with accounts,
in about 20 minutes. It works on Hostinger **Premium, Business and Cloud** web hosting
(PHP + MySQL + Apache/LiteSpeed with `.htaccess`). No Node.js or build step is needed.

> Throughout, replace `example.com` with your domain and `u123456789` with your Hostinger
> username (shown in hPanel → **Websites → Manage → Dashboard → Details**).

---

## 1. Get the files

On your computer, in the project folder:

```bash
tools/package.sh
```

This creates `dist/keyquest-YYYYMMDD-HHMM.zip`. Inside it:

| Folder / file | Goes where on Hostinger |
|---|---|
| `public_html/` (its **contents**) | your website’s `public_html` folder |
| `app/`, `content/`, `install/`, `storage/`, `config.sample.php` | **beside** `public_html` (one level up) |

The folder *beside* `public_html` is `/home/u123456789/domains/example.com/`. Keeping the
application code there means nobody can ever download it from the web.

> **Subdomain created inside another site?** Some subdomains live at
> `…/domains/example.com/public_html/typing/`. That works too: put **everything** from the zip
> into that folder (so `app/` sits next to `index.php`). KeyQuest detects this layout
> automatically and its `.htaccess` blocks `app/`, `content/`, `install/` and `storage/`.

## 2. Choose PHP 8.2 or newer

hPanel → **Websites → Manage → Advanced → PHP Configuration**:

1. **PHP version**: choose **8.3** (8.2 is the minimum).
2. **PHP extensions**: make sure `pdo_mysql`, `mbstring` and `openssl` are ticked (they are
   by default).

## 3. Create the database

hPanel → **Databases → Management** (MySQL Databases):

1. Create a database, e.g. name `keyquest`, user `keyquest`, and a **strong password**
   (use the generator). Hostinger adds a prefix, so you get names like
   `u123456789_keyquest`.
2. Write down the **database name**, **user name** and **password**. The host is
   `localhost` – not the `srvNNNN.hstgr.io` address, which is only for remote connections.

## 4. Upload

Either use hPanel → **Files → File Manager**, or SFTP (hPanel → **Files → FTP Accounts**).

1. Open `/domains/example.com/`. Delete Hostinger’s default `public_html/default.php` (if any).
2. Upload the zip into `/domains/example.com/` and **Extract** it there (File Manager:
   right-click → Extract).
3. You should now see `app/`, `content/`, `install/`, `storage/`, `config.sample.php` and
   `public_html/` (with `index.php`, `.htaccess` and `assets/` inside).

> Hidden files: make sure `public_html/.htaccess` exists. In File Manager, enable
> **Show hidden files** in the settings if you can’t see it.

## 5. Configure

1. In `/domains/example.com/`, copy `config.sample.php` to **`config.php`** and edit it:

```php
'app' => [
    'name'      => 'KeyQuest',
    'env'       => 'production',   // hides the style guide and all error details
    'debug'     => false,
    'base_path' => null,           // auto-detected
    'base_url'  => 'https://example.com',
    'timezone'  => 'Europe/London',
    'contact_email' => 'hello@example.com', // shown on the privacy page (optional)
],
'db' => [
    'host' => 'localhost',
    'port' => 3306,
    'name' => 'u123456789_keyquest',
    'user' => 'u123456789_keyquest',
    'pass' => 'the-password-from-step-3',
    'charset' => 'utf8mb4',
],
'mail' => [
    'driver'     => 'smtp',               // or 'mail' to use PHP mail()
    'from_email' => 'no-reply@example.com',
    'from_name'  => 'KeyQuest',
    'smtp' => [
        'host' => 'smtp.hostinger.com',
        'port' => 465,
        'encryption' => 'ssl',
        'username' => 'no-reply@example.com',
        'password' => 'the-mailbox-password',
    ],
],
'session'  => ['driver' => 'database'],
'security' => ['force_https' => false, 'trust_proxy' => false], // turn HTTPS on in step 8
```

   For password-reset emails, create the mailbox first: hPanel → **Emails → Email
   Accounts → Create** `no-reply@example.com`.

2. Make `storage/` writable (File Manager → right-click `storage` → **Permissions** →
   `755`, apply to sub-folders). KeyQuest writes logs, a small cache and – only if you
   choose the `files` session driver – sessions there.

`config.php` contains secrets. It lives outside `public_html`, and `.htaccess` refuses to
serve it even if it is ever placed inside.

## 6. Create the tables

Choose **one**:

- **Web installer (easiest):** visit `https://example.com/setup`, check the three ticks and
  press **Create tables**. The installer then locks itself (`storage/installed.lock`); visiting
  `/setup` again shows "page not found".
- **SSH:** hPanel → **Advanced → SSH Access**, connect, then
  ```bash
  cd domains/example.com && php install/migrate.php
  ```
- **phpMyAdmin:** hPanel → **Databases → phpMyAdmin** → your database → **Import** →
  `install/schema.sql`.

All three are safe to repeat: every statement is `CREATE TABLE IF NOT EXISTS`.

## 7. Check it works (HTTP)

Open `https://example.com` (or `http://…` if SSL isn’t ready yet):

- [ ] Home page shows, with colours and fonts.
- [ ] `/api/health` returns `{"ok":true,…}`.
- [ ] `/lessons` shows ten units; the first lesson starts and you can type.
- [ ] `/styleguide` shows **page not found** (production mode).
- [ ] `https://example.com/config.php`, `/app/bootstrap.php` and `/storage/` are **forbidden**.

## 8. Switch on HTTPS

1. hPanel → **Security → SSL**: install the free SSL certificate for the domain (often
   already active).
2. hPanel → **Security → SSL → Force HTTPS** (or uncomment the three
   `HTTPS redirect` lines at the top of `public_html/.htaccess`).
3. In `config.php` set `'force_https' => true` – login cookies become HTTPS-only and the
   `Strict-Transport-Security` header is sent.
4. Using **Cloudflare** in front? Set SSL/TLS mode to **Full (strict)**, never *Flexible*
   (Flexible causes an endless redirect loop). Then also set `'trust_proxy' => true`.

## 9. Final testing checklist

- [ ] Register an account at `/register` after finishing a lesson as a guest → your stars
      and XP appear on `/progress`.
- [ ] Log out and log in again (also from another browser) → progress is still there.
- [ ] `/forgot-password` → the email arrives → the link lets you choose a new password.
- [ ] Play a game at `/games`, take a test at `/test`, open `/badges`.
- [ ] Try it on a phone: you should see the "needs a physical keyboard" notice.
- [ ] `storage/logs/` has no new `app-*.log` errors after a few minutes of use.

---

## Updating to a new version

1. Run `tools/package.sh` again and upload/extract the new zip over the old files
   (your `config.php` and `storage/` contents are not in the zip, so they are kept).
2. Run the installer again **if the release notes mention database changes**:
   `php install/migrate.php` over SSH, or delete `storage/installed.lock` and visit `/setup`.
3. Nothing to clear: asset URLs are versioned automatically, so browsers fetch the new
   JavaScript and CSS straight away.

## Backups and restore

**What to back up**

| What | Where | How |
|---|---|---|
| Database (accounts and progress) | MySQL | hPanel → **Files → Backups → Databases** (daily, automatic on most plans), or phpMyAdmin → **Export** → SQL |
| `config.php` | beside `public_html` | download a copy and keep it somewhere safe – it holds your passwords |
| Code | Git repository / the zip | can always be rebuilt with `tools/package.sh` |

`storage/` only holds logs and a cache – it doesn’t need backing up.

**Over SSH** you can also run:

```bash
mysqldump -u u123456789_keyquest -p u123456789_keyquest | gzip > keyquest-$(date +%F).sql.gz
```

**Restore**

1. Upload the files (step 4) and your saved `config.php` (step 5).
2. Import the SQL backup: phpMyAdmin → your database → **Import**, or over SSH
   `gunzip -c keyquest-YYYY-MM-DD.sql.gz | mysql -u USER -p DATABASE`.
3. Run `php install/migrate.php` (adds any tables that are newer than the backup).

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| **500 error** | Check `storage/logs/app-YYYY-MM-DD.log`. Most often: PHP older than 8.2 (step 2), or `config.php` has a typo. |
| Every page except the home page is **404** | `public_html/.htaccess` is missing or wasn’t uploaded (hidden file). |
| Page has **no styling** | Same as above – asset URLs are rewritten by `.htaccess`. |
| "Accounts aren’t available on this server yet" | The `db` settings in `config.php` are empty or wrong; use host `localhost`. |
| Database connection fails | Use the **prefixed** database and user names, host `localhost`. |
| Reset emails don’t arrive | Check the mailbox exists and the SMTP password; try `'driver' => 'mail'`; look in spam. |
| **Too many redirects** | Cloudflare SSL mode is *Flexible* – change to *Full (strict)* (step 8). |
| Logged out after a while | Normal after 30 days of inactivity. Sessions are stored in the database. |
