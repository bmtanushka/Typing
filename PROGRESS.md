# Progress

| Phase | Status |
|---|---|
| 0 – Foundations | ✅ Done |
| 1 – Typing engine + keyboard | ✅ Done |
| 2 – Lesson framework + Units 1–2 | ✅ Done |
| 3 – Guest progress + motivation | ✅ Built – awaiting review |
| 4 – Accounts + sync | ⏳ Next |
| 5 – Remaining curriculum + practice modes | – |
| 6 – Games | – |
| 7 – Polish | – |
| 8 – Deployment to Hostinger | – |

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
- Live test site: https://web-production-c9fae285.up.railway.app – deploys the branch
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
