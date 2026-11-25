#!/bin/sh
# Recreates the GCC 15.2 cross-compiler targeting aarch64-linux-gnu that
# produced this subject's ARM64 listings, without root access: Ubuntu 26.04
# packages extracted into a local folder, plus a wrapper script. It is used
# only for -S listings, so no ARM64 C library is installed. Usage:
#
#   sh setup-gcc-arm64-ubuntu.sh /tmp/anvaya-cc-arm64
#   ANVAYA_CC=… ANVAYA_CC_ARM64=/tmp/anvaya-cc-arm64/compiler pnpm test
#
# Without ANVAYA_CC_ARM64 the ARM64 drift check is reported as skipped.
set -eu
root=${1:-/tmp/anvaya-cc-arm64}
mkdir -p "$root/debs" "$root/root"
# Absolute, because the steps below run from "$root/debs".
root=$(cd "$root" && pwd)
cd "$root/debs"
apt-get download gcc-15-aarch64-linux-gnu cpp-15-aarch64-linux-gnu \
  gcc-15-aarch64-linux-gnu-base libgcc-15-dev-arm64-cross libisl23 libmpc3 \
  libmpfr6
for package in *.deb; do dpkg-deb -x "$package" "$root/root"; done
lib="$root/root/usr/lib/x86_64-linux-gnu"
cat > "$root/compiler" <<WRAPPER
#!/bin/sh
LD_LIBRARY_PATH=$lib\${LD_LIBRARY_PATH:+:\$LD_LIBRARY_PATH} \\
  exec $root/root/usr/bin/aarch64-linux-gnu-gcc-15 "\$@"
WRAPPER
chmod +x "$root/compiler"
"$root/compiler" --version | head -n 1
