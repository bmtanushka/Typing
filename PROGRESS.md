# Progress

| Phase | Status |
|---|---|
| 0 – Foundations | ✅ Built – awaiting review |
| 1 – Typing engine + keyboard | ⏳ Next |
| 2 – Lesson framework + Units 1–2 | – |
| 3 – Guest progress + motivation | – |
| 4 – Accounts + sync | – |
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

## Test deployment (Railway)
- Live test site: https://web-production-c9fae285.up.railway.app – auto-deploys on every push
  to `claude/determined-albattani-7m20sy`.
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
- [ ] Badge icons currently use emoji in the style guide; replace with SVG in Phase 3.
