# CLAUDE.md – project conventions

Read `PROGRESS.md` first for the current phase and open items. The full product
brief is summarised there; work phase by phase and stop for review at the end of each.

## Hard constraints
- Hosting is Hostinger shared/cloud: **PHP 8.2+, MySQL/MariaDB, Apache `.htaccess`**.
  No Node.js on the server, no WebSockets, no long-running processes, no Redis.
- **No build step.** Ship the files as written. No CDNs – self-host everything.
- **Ask the user before adding any third-party dependency**, service, font or paid API.
- **British English** in all UI copy (colour, practise (verb) / practice (noun), favourite…).
- Original content only – never copy text, art or lesson wording from typing.com or similar.

## Backend (PHP)
- `declare(strict_types=1);` in every file. Namespace `App\` maps to `app/`.
- Routes go in `app/router.php`; handlers are `[Controller::class, 'method']` receiving
  `(Request $request, array $params)` and returning `Response`, an HTML string, or an
  array (sent as JSON).
- JSON API lives under `/api/*` and always returns `{ ok: bool, ... }`.
- Views are plain PHP in `app/Views`; **escape every output with `e()`**. Build links
  with `url()` and asset links with `asset()`. In production `asset()` puts the version in the
  PATH (`/assets/_v<hash>/…`, rewritten by .htaccess) so relative ES-module imports inherit it;
  assets are cached as immutable, so never link an asset without `asset()`.
- DB access: PDO prepared statements only (from Phase 4). Validate every input.
- Never show errors to users in production; `ErrorHandler` logs to `storage/logs`.
- Config via `config('a.b')`; secrets only in `config.php` (git-ignored).

## Frontend
- ES modules, no bundler. `assets/js/app.js` runs on every page; page code lives in
  `assets/js/pages/<page>.js` and is passed to the layout as `pageScript`.
- **CSP is strict** (`script-src 'self'; style-src 'self'`): no inline `<script>`, no
  `onclick=""`, no `style=""` attributes. Setting `el.style.x` from JS is fine.
  SVG colours use CSS classes, not `fill="var(--x)"`.
- All local state goes through `assets/js/core/store.js` (localStorage key
  `keyquest.v1`, `schemaVersion` + `MIGRATIONS` for shape changes).
- Theme: `theme-init.js` (classic script in `<head>`) sets `data-theme` before paint;
  `core/theme.js` handles changes. Keep the two in sync.
- Keep logic (stats, generators) pure and DOM-free so it can be unit-tested.
- Typing: always build exercises on `engine/typing-engine.js` (+ `connectVisuals` for keyboard
  and hands). Compare `event.key` to the target text; layouts only drive the on-screen keyboard.
- Keyboard layouts are JSON in `content/layouts/` (served by `/api/layouts/{id}`); each key has
  `code` (KeyboardEvent.code), `base`, `shift`, `finger`, optional `width`/`special`.

## Lesson content (content/lessons)
- `units.json` lists units in course order (`id`, `title`, `description`, `colour`, `lessons[]`).
- One file per lesson, `<id>.json` (id = lowercase slug, matches file name):
  `id, unit, title, type (tutorial|lesson|checkpoint), newKeys[], estimatedMinutes,
  intro {text, tip}, steps[], passCriteria {minAccuracy, minWpm}, stars {two, three}`.
- Step types: `info` (body[], art, highlight[], waitFor[]), `keys` (keys[], rounds, groupSize –
  always stopOnError, large text, not counted for WPM), `drill` (text or generated: length,
  focus[]), `words` (count, focus[] – real words from content/wordlists filtered to learnt keys),
  `challenge` (text or [alternatives], hints: show|fade|none). Every step has `title` and
  optional `instructions`. `text` may be a string or an array (one is picked at random).
- Texts may only use keys learnt so far – `tests/php/LessonContentTest.php` enforces this.
- Copy is original, British English, encouraging and never negative.

## Motivation
- XP, levels, streaks and badges live in `assets/js/core/rewards.js` (pure, tested). Record
  lessons with `recordLesson` and other practice with `recordPractice` – never write progress
  fields by hand.
- Badges are data in `content/badges.json` (`id, title, description, icon, colour, criteria`);
  criteria types are listed in `KNOWN_CRITERIA`. Icons come from `core/icons.js`.
- Pip's copy lives in `core/mascot.js` – specific, varied and never negative (a test checks).
- Sounds (`core/sound.js`) are synthesised and off by default; confetti respects reduced motion.

## Accounts and sync
- Every state-changing endpoint: `AuthController::guard()` (CSRF via `X-CSRF-Token`, 403 on
  failure – never use non-standard status codes, Apache turns them into 500). Use the
  browser helpers in `core/api.js`.
- Sessions start lazily (`Session::start()` only for auth); read with `Auth::user()`.
- Every new kind of activity must (1) update the local store via `rewards.js`, and (2) call
  `track(makeEvent(type, ref, result, {stars, score, xp, badges, skipped}))` from `core/sync.js`.
  Server-side validation lives in `ProgressService::validateEvent` – extend it, keep the
  plausibility limits.
- `/install` paths are blocked by .htaccess; the web installer is `/setup`.

## CSS
- Design tokens in `assets/css/tokens.css` – use variables, never hard-code colours.
  Dark theme overrides live under `:root[data-theme="dark"]`.
- Finger colour tokens `--f-{lp,lr,lm,li,ri,rm,rr,rp,th}` (+ `-edge`) are the single
  source of truth for finger colours everywhere.
- BEM-ish class names (`.block__element--modifier`), state classes `.is-*`.
- WCAG 2.2 AA contrast for text pairs (check when adding tokens), visible focus,
  respect `prefers-reduced-motion`.

## Testing & workflow
- `php tests/run.php` (PHP) and `node tests/js/run.mjs` (JS). All tests must pass before commit.
- With a database + Apache: `php tests/integration/api.php <base-url>` and
  `BASE=<base-url> node tests/e2e/run.cjs` (Playwright, dev-only). Browser robots must type at
  a human-plausible speed (≥ 60 ms per key) when signed in, or the server rejects the result.
- Run locally with `php -S localhost:8000 -t public_html` (no `.htaccess` there – test
  rewrites, headers and caching under Apache before deploying).
- Small, focused commits with clear messages. Update `PROGRESS.md` at the end of each phase.
