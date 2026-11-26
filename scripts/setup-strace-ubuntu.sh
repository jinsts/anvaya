#!/bin/sh
# Recreates strace 6.19, which recorded the system-call traces, without root
# access: the Ubuntu 26.04 package extracted into a local folder, plus a
# wrapper script. It uses this machine's C, unwind and terminal libraries.
# Usage, from anywhere:
#
#   sh scripts/setup-strace-ubuntu.sh /tmp/anvaya-strace
#   ANVAYA_STRACE=/tmp/anvaya-strace/strace pnpm test
#
# On another Ubuntu release, add ANVAYA_UBUNTU_SUITE=resolute
# (scripts/ubuntu-packages.sh). Tracing needs ptrace: a container or a
# kernel.yama.ptrace_scope of 3 can forbid it, and the traces are then
# reported as skipped.
set -eu
here=$(cd "$(dirname "$0")" && pwd)
. "$here/ubuntu-packages.sh"
root=${1:-/tmp/anvaya-strace}
mkdir -p "$root"
root=$(cd "$root" && pwd)
ubuntu_extract "$root" strace
cat >"$root/strace" <<WRAPPER
#!/bin/sh
exec $root/root/usr/bin/strace "\$@"
WRAPPER
chmod +x "$root/strace"
"$root/strace" -V | head -n 1
