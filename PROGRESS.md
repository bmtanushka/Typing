# Progress

| Phase | Status |
|---|---|
| 0 – Foundations | ✅ Done |
| 1 – Typing engine + keyboard | ✅ Done |
| 2 – Lesson framework + Units 1–2 | ✅ Done |
| 3 – Guest progress + motivation | ✅ Done |
| 4 – Accounts + sync | ✅ Done (user asked to continue straight to Phase 6) |
| 5 – Remaining curriculum + practice modes | ✅ Done |
| 6 – Games | ✅ Done |
| 7 – Polish | ✅ Done |
| 8 – Deployment to Hostinger | ✅ Done (guide + package script) |

## Phase 0 – Foundations

**Built**
- Project skeleton (`public_html/` web root; `app/`, `content/`, `install/`, `storage/`
  outside it, with automatic fallback if everything is inside `public_html`).
- Front controller + tiny router (static + `{param}` routes, 404/405, HEAD, JSON for arrays).
- Config loader with safe production defaults; `config.sample.php`.
- Base-path detection (domain root or subfolder) – verified at `/` and `/typing/`.
- Error handling: errors → exceptions, logged to `storage/logs/app-YYYY-MM-DD.log`,
  friendly 500 page; details only in debug mode. Friendly 404 page.
- Security headers (CSP, nosniff, frame denial, referrer, permissions, COOP) from both
  `.htaccess` and PHP (so the built-in dev server gets them too).
- `.htaccess`: front-controller routing, blocks dotfiles/internal folders/config,
  long-cache for versioned assets, gzip. `Require all denied` in internal folders.
- Base layout (header, responsive nav with mobile menu, footer, skip link).
- Design tokens (type scale, spacing, radii, motion, colours, finger colours, mascot),
  light + dark themes with System/Light/Dark toggle (no flash on load), font-size hook.
- Versioned guest store (`keyquest.v1`, `schemaVersion`, migration hook, in-memory
  fallback, cross-tab sync).
- Original mascot **Pip** (SVG keycap character, moods: happy / cheer / think).
- Home page, placeholder pages for every planned section, `/styleguide` (dev only).
- `/api/health` JSON endpoint.
- PHP test runner + router/request/escaping tests (7 passing).

**Verified**
- All routes return expected codes; POST to GET-only API → 405 JSON.
- No console errors or CSP violations (Chromium, light + dark, desktop + mobile).
- Production mode: `/styleguide` → 404, exceptions show the generic 500 page only.
- Token contrast: all text/background pairs ≥ 4.5:1 in both themes.

**How to test**
1. `cp config.sample.php config.php`
2. `php -S localhost:8000 -t public_html`
3. Visit `/`, `/styleguide`, `/lessons` (placeholder), `/does-not-exist` (404),
   `/api/health`.
4. Click the theme button in the header (System → Light → Dark), reload: it persists.
5. Narrow the window below ~900px: the menu collapses behind the ☰ button.
6. `php tests/run.php`

## Phase 7 – Polish

**Done**
- **Help** (`/help`): posture, home row, finger map, technique, how KeyQuest works, FAQ.
  **Privacy** (`/privacy`): plain-English account of what’s stored (guest = browser only;
  account data; one strictly-necessary session cookie; security records kept 2 days; export
  and delete). Optional contact email via `app.contact_email` / `CONTACT_EMAIL`.
  The "coming soon" placeholder mechanism is gone – every page is real.
- **Touch-only devices**: a friendly "needs a physical keyboard" notice on every page,
  hidden as soon as a real key is pressed (e.g. a tablet with a Bluetooth keyboard).
- **Accessibility audit** (`tests/e2e/a11y.e2e.cjs`, no dependencies): every page in light
  and dark, with and without progress (dashboard charts, map with stars, badges, a lesson
  mid-typing): one `h1`, heading order, labels, accessible names, unique ids, landmarks,
  no positive tabindex, **WCAG AA contrast on all visible text**, visible keyboard focus.
  It found and I fixed 3 contrast issues (games card gold text, link in a dark-theme alert,
  streak number in the header chip). Now 0 issues.
- **Responsive**: no horizontal overflow on any page at 360 px and 768 px (one fixed:
  long button labels now wrap on small phones); dashboard stats two-per-row on phones.
- **Performance**: `module_graph()` walks each page’s ES-module imports (cached per asset
  version) and the layout emits `<link rel="modulepreload">` for all of them, removing the
  request waterfall that unbundled modules cause; the UI font is preloaded. No console
  warnings. Page weight (uncompressed): home 79 KB … lesson 177 KB – all under budget.
- **Error states**: if page data can’t load, pages show "Sorry – this page couldn’t load…"
  with a Try again button instead of going blank (`resilience.e2e.cjs`).
- **Copy review**: British English checked across views, lesson content and scripts.
- **Production hardening**: sessions stored in MySQL (`sessions` table, `DbSessionHandler`)
  so logins survive redeploys; strict session-id validation (made-up ids are rejected –
  checked); HSTS header when `security.force_https` is on. Railway now runs with
  `APP_ENV=production` and `FORCE_HTTPS=true` behind Cloudflare (SSL mode Full (strict)).

**Verified**: 72 JS + 20 PHP unit tests, 19 API tests, 8 browser suites (a11y,
accounts, curriculum, games, lessons, motivation, playground, resilience) – all passing.

## Phase 6 – Games

**Built**
- `/games` hub (best score per game) and `/games/{id}`. Each game is its own module, loaded
  only on its page (dynamic import).
- `games/framework.js`: canvas sizing (HiDPI), 60 fps loop with capped frame time, keyboard
  input, Esc / window blur / tab switch pause, HUD (score, lives, level), polite screen-reader
  announcements, particles (off with reduced motion), word targeting, theme-aware colours.
  Items are coloured by the **finger** that types them (same colours as the keyboard).
- Start screen: difficulty (Gentle – default – / Normal / Speedy: speed, spawn rate, lives),
  keys (only keys I’ve learnt / home row / all letters), sound on/off; remembered per game.
- Games (all original):
  - **Key Drops** – letters fall like raindrops; the lowest matching drop bursts. Levels speed up.
  - **Balloon Pop** – words float up in balloons; the first letter picks the balloon.
  - **Space Defender** – asteroids carry words towards your ship; each letter fires the laser.
  - **Word Race** – race a ghost car at 10 / 20 / 30 WPM; mistakes don’t move you.
  - **Typing Bubbles** – big, slow, single-letter bubbles; no lives to lose; 90 seconds.
- Results screen: score, best, accuracy, XP, new badges ("Game on", "High scorer"),
  confetti for a new best. Scores sync to the account (`game_scores` keeps the best).
- Beginner friendliness: Gentle by default, generous lives, the next item appears straight
  away when the screen is empty, items start in view.

**Verified**: `games.e2e.cjs` plays all five games with Playwright's virtual clock (bursts
drops, pops balloons, clears asteroids, wins the race, pops bubbles; Esc pause; results;
best scores; hub) – no console errors. API test: game events keep the best score. 72 JS +
20 PHP unit tests, 19 API tests, 6 browser suites all pass.

**Page weight** (JS + CSS, uncompressed, before gzip): home 79 KB, lesson 177 KB, practice
141 KB, game 125 KB, progress 119 KB – all under the 200 KB budget. The lesson page is the
heaviest; it gets a look in the Phase 7 performance pass.

## Phase 5 – Remaining curriculum + practice modes

**Built**
- Units 3–10 (42 new lessons, 51 in total), all original British-English copy:
  Top row (E I, R U, T Y, W O, Q P, words, checkpoint) · Bottom row (**B N first**, then C ,
  V M, X ., Z /, words with pangrams, checkpoint) · Capitals and Shift (left Shift for
  right-hand capitals, right Shift for left-hand capitals, sentences, checkpoint) ·
  Punctuation (' ", ? !, : -, ( ), practice, checkpoint) · Numbers (1–5, 6–0, numbers in
  sentences, checkpoint) · Symbols (@ #, $ % &, * + =, practice, checkpoint) · Real-world
  practice (sentences, a three-part story, emails, Shakespeare + proverbs, checkpoint) · Speed
  building (rhythm, one-minute sprints, two-minute stamina, timed checkpoint).
- Decision: the bottom row teaches **B and N first** (the brief listed them last). N is one of
  the most common letters, so without it the next four lessons could not use real sentences.
- Lesson format additions: `timeLimit` on steps (countdown, text keeps coming), words-step
  options `capitalise` (ratio), `sentences`, `numbers`; optional `mapLabel` for the map disc.
  Generators `capitaliseWords`, `toSentences`, `sprinkleNumbers` (pure, tested) only ever use
  learnt characters.
- Content checks: every text in units 2–10 uses only keys learnt so far (PHP test) and every
  character in every lesson, test and placement text is typeable on **both** UK and US layouts
  (JS test). The generator script refuses to write a lesson that breaks this.
- `/placement`: one-minute test → recommends units to skip (needs ≥ 90% accuracy; 10/18/25/32
  WPM bands; real-world practice and speed building are never skipped) → "Skip these and
  start". Linked from the home page and the lessons map.
- `/practice`: problem keys (weighted drill from your key stats, or a warm-up when you have no
  problem keys yet), word sets (learnt keys / common words / sentences / paragraphs), your own
  text (smart quotes and dashes converted, untypeable characters removed); untimed, 1 or 2 min.
- `/test`: 1, 3 or 5-minute tests on original paragraphs (`content/texts/tests.json`),
  personal-best celebration, history chart (hover + table view). Tests count towards the speed
  badges; practice/tests award XP and streaks and sync to the account.
- Shared `core/exercise.js` + `partials/exercise.php` (engine, keyboard, hands, live stats).

**Verified**: 66 JS + 20 PHP unit tests, 18 API tests, 5 browser suites (new
`curriculum.e2e.cjs` uses Playwright's virtual clock: ten units, placement → skip ahead,
capitals with opposite Shift, speed unit still locked, timed lesson step, 1-minute test +
history, own text, problem keys) – no console errors.

**How to test**: `/placement` (type for a minute), `/lessons` (all ten units), `/test`,
`/practice` (try all three modes), any capitals or numbers lesson.

## Phase 4 – Accounts + sync

Decisions (approved "go ahead with all"): MySQL on Railway for testing; mail driver `log` on
Railway (SMTP or `mail()` configurable for Hostinger); Argon2id (bcrypt fallback); Playwright
as a dev-only dependency (`package.json`, never deployed).

**Built**
- `install/schema.sql` (users, lesson_progress, results, key_stats, badges, game_scores,
  password_resets, login_attempts + `action`, guest_merges). Idempotent. Three ways to install:
  `php install/migrate.php` (SSH), the one-time web installer at **`/setup`** (locks itself via
  `storage/installed.lock`), or phpMyAdmin import. Docker/Railway runs migrations at start-up.
- PHP core: `Database` (PDO, prepared statements, no emulation, UTC), `Session` (lazy – guests
  get no cookie; HttpOnly, Secure on HTTPS, SameSite=Lax, strict mode, regenerated on login),
  `Csrf` (synchroniser token, `X-CSRF-Token` header, 403 on failure), `RateLimiter`
  (DB-backed: login 5/email + 20/IP per 15 min, register 5/IP/h, forgot 3/email + 10/IP per h,
  reset 10/IP/h), `Validator`, pluggable `Mailer` (log / mail() / SMTP with SSL or STARTTLS).
- Auth API: `GET /api/session`, `POST /api/auth/{register,login,logout,forgot,reset}`.
  No account enumeration (same reply for unknown emails; dummy hash on unknown login).
  Password reset tokens are random, stored hashed, expire after an hour, single use.
- Sync: the browser records activity locally and, when signed in, queues **events** with a
  client id (`core/sync.js`); `POST /api/progress/sync` applies them idempotently with
  plausibility checks (≤ 250 WPM, ≤ 300 raw, characters must fit the time, accuracy 0–100,
  known badges, slug ids, XP ≤ 300 per event) and returns the account state. Offline-tolerant:
  queue persists, retries with back-off, on `online` and when the tab becomes visible.
  Settings and skipped lessons sync too.
- Guest → account merge on register/login (`POST /api/progress/merge`): best per lesson, sum
  XP, union badges, add key stats, better streak, keep game bests; idempotent per merge id;
  the guest store is then replaced by the account mirror. Logging out removes account data
  from the device (settings kept).
- Pages: `/register`, `/login`, `/forgot-password`, `/reset-password`, `/account` (change
  name/email/password, download my data, delete account with password confirmation),
  `/progress` dashboard (summary, WPM + accuracy trend charts with hover tooltip and table
  view, single-hue problem-key heatmap, course progress, recent activity, badges) – works for
  guests too. Header shows the signed-in learner.

**Verified**
- `php tests/integration/api.php http://localhost:8090` → 18 passed (CSRF, validation, cookie
  flags + session regeneration, idempotent sync, best-result rules, implausible results
  rejected, settings/skipped sync, logout, login, merge once, profile/password, export without
  hash, forgot = same reply, bad reset token, login rate limit, delete).
- `BASE=http://localhost:8090 node tests/e2e/run.cjs` → all suites (accounts: guest → register
  merge → dashboard → synced lesson → logout clears → login restores → second device →
  profile → reset via mail log → delete). Unit tests: 60 JS, 15 PHP.

**How to test (Railway)**: register at `/register` after finishing a lesson as a guest, open
`/progress`, log in from another browser, try `/account`. Reset emails are written to the log
on Railway (not sent).

Notes: sessions are files in `storage/sessions`; on Railway they reset on each deploy (you'll
need to log in again) – fine for testing, persistent on Hostinger.

## Phase 3 – Guest progress + motivation

**Built**
- Unlocking (`core/lesson-logic.js`): lessons open in order; failed attempts stay open; skip a
  unit without a checkpoint ("Skip – I know this already"); **test out** of a unit by passing
  its checkpoint (available once the unit is reached) – this skips the unit's remaining
  lessons and opens the next unit. Skipped lessons stay playable. Locked lessons on the map open
  a friendly dialog (what to finish first + test-out option); a direct URL shows a locked screen.
- `core/rewards.js` (pure): XP (finishing 10, +5/star, first pass +20, checkpoint +50, new
  stars +10 each, practice 8), levels (100, 150, 200… XP), daily streak on the learner's local
  calendar, badge evaluation from `content/badges.json` (17 badges, 11 criteria types),
  `recordLesson` / `recordPractice` returning a summary for the results screen.
- `core/mascot.js`: Pip's varied, never-negative messages – specific improvements first
  ("Nice! Your accuracy improved by 6%.", "You’re 4 WPM faster than your best!"), unit
  completion, level ups, streaks, then encouragement by stars.
- Results screen: Pip speech bubble, +XP, level bar (level up!), streak, new badge cards;
  confetti + fanfare on unit completion (smaller burst on level up); reduced motion → no confetti.
- `core/sound.js`: soft Web Audio sounds (key click, gentle error, step, success, badge,
  level up) – no audio files, **off by default**, also in the playground.
- Header chip: streak flame + level (links to badges). Guest banner "Create a free account to
  save your progress on any device." on the map, badges page and lesson results – dismissible
  for a week.
- `/badges`: level, streak (current + best), earned count, all badges with earned dates, "New"
  sparkle once. Original SVG icon set (`core/icons.js`).
- `/settings`: theme, text size (applied before paint), keyboard layout (auto/UK/US), keyboard,
  hands, backspace, sound (+ sample), download my progress (JSON), reset progress (confirm dialog,
  keeps settings).

**Verified**
- `node tests/js/run.mjs` → 57 passed (XP, levels, streak dates across month ends, badges,
  checkpoint test-out, unlocking, mascot messages never negative); `php tests/run.php` → 15.
- Browser suites run against **Apache** (same `.htaccess` as production): Phase 3 suite (locking,
  dialog, locked URL, skip ahead, rewards, 7 badges, test out + confetti + unit badge, banner
  dismiss, badges page, settings persist, export, reset) plus the Phase 1–2 suites – no console
  errors.

**How to test**
1. Fresh browser (or Settings → Reset): on Lessons only *Welcome aboard* is open; tap a locked
   lesson to see the dialog.
2. Click **Skip – I know this already** on Getting started → F and J opens and **Test out with
   the checkpoint** appears on The home row.
3. Finish F and J: see +XP, level bar, 1-day streak, new badges, Pip's message, header chip.
4. Pass the Home row checkpoint → confetti, "Home sweet home", the rest of the unit is skipped.
5. Open **Badges** and **Settings** (try sound on, Large text, dark theme, export, reset).

## Phase 2 – Lesson framework + Units 1–2

**Built**
- Lesson format (see CLAUDE.md): `content/lessons/units.json` + one JSON per lesson;
  `LessonRepository` (PHP) reads and indexes it. APIs: `GET /api/lessons` (course index,
  ETag), `GET /api/lessons/{id}`, `GET /api/wordlists/{id}`.
- Original word list `content/wordlists/en-common.json` (≈690 common words, British spelling,
  child-friendly) – words are filtered to the keys a learner has unlocked.
- `engine/generators.js` (pure, seeded RNG): key repeats, pattern drills mixing new + learnt
  keys, real-word drills (with pattern fallback), weighted problem-key drills.
- `core/lesson-logic.js` (pure): allowed keys per lesson, combine step results (accuracy over
  all steps, WPM over scored steps), stars (pass mark + 2/3-star thresholds), save best result
  into the guest store, next lesson.
- Lesson player `/lessons/{id}`: intro (big finger-coloured keycaps, finger names, animated
  hands tapping + keyboard demo, tip, Enter to start) → steps with progress indicator →
  `info` screens with illustrations and "press these keys" checklists → `keys` (large text,
  stop on error) → `drill` → `words` → `challenge` (keyboard hints fade) → quick praise between
  steps (Enter to continue) → results with animated stars, WPM, accuracy, time, errors, problem
  keys + keyboard heatmap, kind message (names the pass mark if not passed), Next lesson /
  Try again / Practise problem keys / Back to lessons.
- Lesson map `/lessons`: units as "islands" with a winding path of nodes (done ✓ green with
  stars, current pulsing, to do), unit progress, "Continue/Start" card, units 3–10 shown as
  coming soon. Home "Start typing" opens the first lesson (or the next one for returning users).
- Content: **Getting started** – Welcome aboard (posture, eyes on screen, how lessons work,
  first space-bar taps), Home position (find the bumps, press each home key, walk the home row).
  **Home row** – F J, D K, S L, A ;, G H, Home row words, Home row checkpoint (no hints,
  90% accuracy + 5 WPM to pass).

**Verified**
- `node tests/js/run.mjs` → 38 passed; `php tests/run.php` → 13 passed (incl. content
  validation: every lesson exists, valid step types, texts only use learnt keys).
- Browser walk-through (Playwright, local): home → Welcome aboard → Home position (key
  checklists) → F and J with a mistake → 3 stars → Retry → failed checkpoint (0 stars, kind
  message, no Next) → map shows 3 done + D and K next → home button continues. No console errors.

**How to test**
1. Home → **Start typing** → you land in *Welcome aboard*; press Enter, Space through the tips.
2. *Home position*: press F and J, then every home key – they tick off.
3. *F and J*: watch the intro demo, then type each step; press Enter between steps.
4. On results try **Practise problem keys** and **Try again**.
5. Open **Lessons**: stars on finished lessons, the next one pulsing, *Continue* card.
6. Try the *Home row checkpoint* – no keyboard on screen; under 90% accuracy you can retry.

Notes: lessons are not locked yet – unlocking, skip-ahead/placement, XP, streaks, badges and
celebrations arrive in Phase 3.

## Phase 1 – Typing engine + keyboard

**Built** (`public_html/assets/js/engine/`)
- `stats.js` (pure): WPM `(correct/5)/min`, raw WPM, accuracy, `m:ss`, per-key stats
  (attempts, errors, latency), `mergeKeyStats`, `problemKeys` ranking.
- `session.js` (pure): `TypingSession` state machine – correct/error/pending per char,
  `stopOnError`, `allowBackspace`, "corrected" tracking, hint after 3 misses on one key,
  `appendText` for timed tests. Timestamps are injected, so it is fully testable.
- `layouts.js`: char → key/finger/Shift map (opposite-hand Shift), Alt Gr (€ on UK),
  friendly hints ("Use your left middle finger for “d”."), locale-based default layout.
- `content/layouts/uk.json` + `us.json`: data-driven ISO UK / ANSI US layouts, served by
  `GET /api/layouts/{id}` (strict slug whitelist, ETag/304, 1 h cache).
- `keyboard.js`: on-screen keyboard (finger colours, F/J bumps, UK two-part Enter),
  next-key + Shift highlight, green/red press feedback, heatmap hook for later.
- `hands.js`: inline-SVG hands; active finger(s) light up in finger colour and lift.
- `typing-engine.js`: renders text per character, smooth caret, line-by-line auto-scroll,
  live stats ticks, time limit, Shift/AltGr, dead keys + IME via hidden textarea, Esc/blur
  pauses with "click to continue" overlay (paused time excluded), Caps Lock warning, never
  traps Tab. Events: start, keystroke, error, hint, tick, pause, resume, capslock, complete.
- `visuals.js`: `connectVisuals(engine, {keyboard, hands, onHint})` – shared wiring.
- `/demo` typing playground: preset texts or your own, timed or untimed, beginner mode,
  backspace, show/hide keyboard and hands, UK/US, large text, results with problem keys.
  Settings persist in the guest store.
- JS test runner `tests/js/run.mjs` (Node, no dependencies).

**Verified**
- `node tests/js/run.mjs` → 25 passed; `php tests/run.php` → 9 passed.
- Browser run (Playwright, not committed – needs approval as a dev dependency): UK default
  for en-GB, autofocus, next key + finger highlight, error/backspace, blur pause + resume,
  completion results, beginner mode holds position, capital P → P + left Shift, `"` typed
  on UK, switch to US layout, hint after 3 misses, light/dark/mobile – no console errors.
- JS + CSS total ≈ 93 KB uncompressed (budget 200 KB).

**How to test** – open `/demo` (locally or on Railway):
1. Type the text; watch the highlighted key and finger move ahead of you.
2. Make a mistake: red shake; Backspace fixes it (dotted underline = corrected).
3. Turn on Beginner mode: wrong keys don't advance; miss a key 3 times for a hint.
4. Press Esc or click away: "Paused – click to continue"; time stops.
5. Pick "Capitals and punctuation": Shift on the opposite hand lights up.
6. Switch UK ↔ US and compare `"` / `@` / `£` / `#`.
7. Try 30 seconds, Large text and "My own text…". Finish to see results + problem keys.

## Test deployment (Railway)
- Live test site: https://typing.compresszone.com – deploys the branch
  `claude/determined-albattani-7m20sy` (deploy-on-push needs the Railway GitHub App on the repo;
  until then Claude triggers each deploy).
- Railway project `keyquest` → service `web`, Dockerfile build, health check `/api/health`.
- Variables: `APP_ENV=development` (so `/styleguide` is visible), `APP_DEBUG=false`,
  `APP_BASE_URL`, `PORT=8080`.
- Hostinger remains the production target (Phase 8).

## Decisions
- PHP renders a page shell for each route, and each page loads its own ES module (not a SPA).
  Page transitions use cross-document View Transitions (progressive enhancement).
- Theme resolved by a tiny blocking script in `<head>`; no-JS users get the light theme.
- Fonts: self-hosted variable **Nunito** (UI) and **JetBrains Mono** (typing), Latin +
  Latin Extended subsets only (~130 KB total, loaded per unicode-range), `font-display: swap`.
  Source: @fontsource-variable packages, SIL OFL 1.1 (licences in `assets/fonts/`).
- Namespace `App\` (not tied to the working product name).
- Mascot named "Pip" (working name).

## Open items / questions
- [x] Fonts approved and self-hosted.
- [x] Name: KeyQuest, mascot: Pip (confirmed).
- [x] Hostinger allows folders beside `public_html` – use that layout.
- [x] Badge icons are now original SVGs (`core/icons.js`).
- [ ] Approve Playwright as a dev-only dependency for committed browser tests (optional).
- [ ] Railway deploy-on-push: add the Railway GitHub App to the repo (deploys triggered manually until then).
