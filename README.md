# KeyQuest

A friendly, beginner-first touch-typing web app: step-by-step lessons, mini-games,
typing tests, stars, streaks and badges. Works without an account (progress in the
browser); an optional free account syncs progress across devices.

*"KeyQuest" is a working name.*

## Tech

- **Backend:** plain PHP 8.2+ (no framework), tiny router, PDO/MySQL (from Phase 4).
- **Frontend:** vanilla JavaScript ES modules + modern CSS. **No build step.**
- **Hosting target:** Hostinger shared/cloud hosting (Apache + `.htaccess`, no Node.js).

## Run locally

Requirements: PHP 8.2 or newer (`php -v`). MySQL/MariaDB is needed from Phase 4.

```bash
cp config.sample.php config.php
```

```bash
php -S localhost:8000 -t public_html
```

Open <http://localhost:8000>. With `app.env = development` you also get the design
system at <http://localhost:8000/styleguide>.

## Tests

```bash
php tests/run.php
```

(JavaScript unit tests for the typing engine arrive in Phase 1.)

## Project structure

```
public_html/            Web root – the only folder served to browsers
  index.php             Front controller
  .htaccess             Routing, security headers, caching
  assets/css            tokens.css (design tokens), base.css, components.css
  assets/js             app.js (shell), theme-init.js, core/, engine/, pages/, games/
  assets/img|fonts|sounds
app/                    PHP application (outside the web root)
  bootstrap.php         Autoload, config, error handling, dispatch
  router.php            Route table
  helpers.php           e(), url(), asset(), config() …
  Core/                 Router, Request, Response, View, Config, ErrorHandler
  Controllers/ Models/ Services/ Views/
content/                Lessons, word lists, texts, keyboard layouts (JSON)
install/                schema.sql + installer (Phase 4)
storage/logs/           Application logs (must be writable)
tests/                  Test runner and tests
config.sample.php       Copy to config.php (git-ignored)
```

`app/`, `content/`, `install/`, `storage/` and `tests/` should sit **next to**
`public_html`, not inside it. If your host forces everything into `public_html`,
`index.php` detects that automatically and `.htaccess` blocks web access to those
folders.

## Subfolder installs

The base path is auto-detected, so the app works at `https://example.com/` or
`https://example.com/typing/`. If detection is wrong, set `app.base_path` in
`config.php` (e.g. `'/typing'`).

## Deployment

A full Hostinger guide arrives in Phase 8. In short: upload the folders above,
point the domain at `public_html`, create `config.php` with `env => 'production'`
and `debug => false`, and make `storage/logs` writable.
