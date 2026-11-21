#!/usr/bin/env bash
# Build a ready-to-upload zip for Hostinger (or any Apache + PHP host).
#
#   tools/package.sh            → dist/keyquest-YYYYMMDD-HHMM.zip
#
# The zip contains exactly what runs in production, laid out for Hostinger:
#   public_html/   → upload into your domain's public_html
#   app/ content/ install/ storage/ config.sample.php   → upload BESIDE public_html
# Nothing for development is included (tests, Docker, node, git, your config.php).
set -euo pipefail

cd "$(dirname "$0")/.."
stamp="$(date +%Y%m%d-%H%M)"
out="dist/keyquest-${stamp}.zip"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

mkdir -p dist "$tmp/keyquest"
# Only committed files (never config.php, logs or local caches)…
git archive --format=tar HEAD public_html app content install storage config.sample.php | tar -x -C "$tmp/keyquest"
# …plus the deployment guide.
cp docs/DEPLOY-HOSTINGER.md "$tmp/keyquest/DEPLOY-HOSTINGER.md"

# Empty, writable runtime folders.
mkdir -p "$tmp/keyquest/storage/logs" "$tmp/keyquest/storage/cache" "$tmp/keyquest/storage/sessions"
rm -f "$tmp/keyquest/storage/installed.lock"

( cd "$tmp/keyquest" && zip -qr -X "$OLDPWD/$out" . )
echo "Built $out ($(du -h "$out" | cut -f1))"
echo "Contents:"
unzip -l "$out" | awk 'NR>3 {print $4}' | grep -E '^[^/]+/?$|^[^/]+/[^/]+/?$' | sort -u | head -40
