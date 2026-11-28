#!/bin/sh
# Recreates Go 1.26, which builds and runs the Go programs and reports their
# escape analysis, without root access: Ubuntu 26.04's packages extracted into
# a local folder. The go command finds its standard library from its own
# location. Usage, from anywhere:
#
#   sh scripts/setup-go-ubuntu.sh /tmp/anvaya-go
#   ANVAYA_GO=/tmp/anvaya-go/root/usr/lib/go-1.26/bin/go pnpm test
#
# On another Ubuntu release, add ANVAYA_UBUNTU_SUITE=resolute
# (scripts/ubuntu-packages.sh).
set -eu
here=$(cd "$(dirname "$0")" && pwd)
. "$here/ubuntu-packages.sh"
root=${1:-/tmp/anvaya-go}
mkdir -p "$root"
root=$(cd "$root" && pwd)
ubuntu_extract "$root" golang-1.26-go golang-1.26-src
go="$root/root/usr/lib/go-1.26/bin/go"
GOTOOLCHAIN=local "$go" version
echo "Set ANVAYA_GO=$go"
