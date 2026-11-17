#!/bin/sh
# Extracts the shared libraries Playwright's Chromium needs on a minimal Ubuntu
# (for example WSL2) into a local folder, without root access or system
# packages. Usage, from anywhere:
#
#   sh scripts/setup-browser-deps.sh /tmp/anvaya-browser-deps
#   LD_LIBRARY_PATH=/tmp/anvaya-browser-deps/usr/lib/x86_64-linux-gnu pnpm test:e2e
#
# Check what is missing first with:
#   ldd ~/.cache/ms-playwright/chromium_headless_shell-*/*/chrome-headless-shell | grep 'not found'
set -eu
root=${1:-/tmp/anvaya-browser-deps}
mkdir -p "$root/debs"
cd "$root/debs"
apt-get download libnspr4 libnss3 libasound2t64
for package in *.deb; do dpkg-deb -x "$package" "$root"; done
lib="$root/usr/lib/x86_64-linux-gnu"
echo "Set LD_LIBRARY_PATH=$lib"
