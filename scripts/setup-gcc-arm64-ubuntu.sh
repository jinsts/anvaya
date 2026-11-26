#!/bin/sh
# Recreates the GCC 15.2 cross-compiler targeting aarch64-linux-gnu that
# produced the recorded ARM64 listings, without root access: Ubuntu 26.04
# packages extracted into a local folder, plus a wrapper script. It is used
# only for -S listings, so no ARM64 C library is installed. Usage:
#
#   sh scripts/setup-gcc-arm64-ubuntu.sh /tmp/anvaya-cc-arm64
#   ANVAYA_CC=… ANVAYA_CC_ARM64=/tmp/anvaya-cc-arm64/compiler pnpm test
#
# On another Ubuntu release, add ANVAYA_UBUNTU_SUITE=resolute
# (scripts/ubuntu-packages.sh). Without ANVAYA_CC_ARM64 the ARM64 drift check
# is reported as skipped.
set -eu
here=$(cd "$(dirname "$0")" && pwd)
. "$here/ubuntu-packages.sh"
root=${1:-/tmp/anvaya-cc-arm64}
mkdir -p "$root"
root=$(cd "$root" && pwd)
ubuntu_extract "$root" gcc-15-aarch64-linux-gnu cpp-15-aarch64-linux-gnu \
  gcc-15-aarch64-linux-gnu-base libgcc-15-dev-arm64-cross libisl23 libmpc3 \
  libmpfr6
lib="$root/root/usr/lib/x86_64-linux-gnu"
cat >"$root/compiler" <<WRAPPER
#!/bin/sh
LD_LIBRARY_PATH=$lib\${LD_LIBRARY_PATH:+:\$LD_LIBRARY_PATH} \\
  exec $root/root/usr/bin/aarch64-linux-gnu-gcc-15 "\$@"
WRAPPER
chmod +x "$root/compiler"
"$root/compiler" --version | head -n 1
