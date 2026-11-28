#!/bin/sh
# Recreates the compiler used for the recorded native artifacts without root
# access: GCC 15.2, binutils 2.46 and the glibc 2.43 headers and start files
# from Ubuntu 26.04 packages, extracted into a local folder, plus wrapper
# scripts. Programs link against and run with this machine's shared C library.
# Usage, from anywhere:
#
#   sh scripts/setup-gcc-ubuntu.sh /tmp/anvaya-cc
#   ANVAYA_CC=/tmp/anvaya-cc/compiler ANVAYA_BINUTILS=/tmp/anvaya-cc/bin pnpm test
#
# On another Ubuntu release, add ANVAYA_UBUNTU_SUITE=resolute to download the
# 26.04 packages (scripts/ubuntu-packages.sh). On a machine with a matching
# gcc-15 and binutils installed, ANVAYA_CC=gcc-15 works too.
set -eu
here=$(cd "$(dirname "$0")" && pwd)
. "$here/ubuntu-packages.sh"
root=${1:-/tmp/anvaya-cc}
mkdir -p "$root"
root=$(cd "$root" && pwd)
ubuntu_extract "$root" gcc-15 gcc-15-x86-64-linux-gnu cpp-15 \
  cpp-15-x86-64-linux-gnu gcc-15-base libgcc-15-dev libc6-dev linux-libc-dev \
  libcrypt-dev libisl23 libmpc3 libmpfr6 libatomic1 libquadmath0 libgomp1 \
  binutils-x86-64-linux-gnu libbinutils libctf0 libctf-nobfd0 libsframe3
# The sysroot's linker scripts name the system's shared C libraries.
lib="$root/root/usr/lib/x86_64-linux-gnu"
mkdir -p "$root/root/lib64" "$root/root/lib/x86_64-linux-gnu"
for name in libc.so.6 libm.so.6 libmvec.so.1 libgcc_s.so.1; do
  ln -sf "/lib/x86_64-linux-gnu/$name" "$lib/$name"
  ln -sf "/lib/x86_64-linux-gnu/$name" "$root/root/lib/x86_64-linux-gnu/$name"
done
ln -sf /lib/x86_64-linux-gnu/libgcc_s.so.1 \
  "$root/root/usr/lib/gcc/x86_64-linux-gnu/15/libgcc_s.so.1"
ln -sf /lib64/ld-linux-x86-64.so.2 "$root/root/lib64/ld-linux-x86-64.so.2"
# The extracted binutils assemble, link and inspect, so listings and
# disassemblies come from the recorded version on any host.
mkdir -p "$root/bin"
for tool in as ld nm objdump; do
  cat >"$root/bin/$tool" <<WRAPPER
#!/bin/sh
LD_LIBRARY_PATH=$lib\${LD_LIBRARY_PATH:+:\$LD_LIBRARY_PATH} \\
  exec $root/root/usr/bin/x86_64-linux-gnu-$tool "\$@"
WRAPPER
  chmod +x "$root/bin/$tool"
done
# Ubuntu's GCC runs /usr/bin/x86_64-linux-gnu-as and -ld by absolute path,
# ahead of PATH and -B. A specs file points both at the extracted wrappers;
# for a C link without LTO, collect2 would only have passed its arguments on.
"$root/root/usr/bin/gcc-15" -dumpspecs |
  awk -v as="$root/bin/as" -v ld="$root/bin/ld" '
    /^\*invoke_as:$/ { spec = 1; print; next }
    /^\*linker:$/ { print; getline; print ld; print ""; next }
    spec && /^ as / { sub(/^ as /, " " as " ") }
    spec { print; if ($0 == "") spec = 0 }
  ' >"$root/binutils.specs"
cat >"$root/compiler" <<WRAPPER
#!/bin/sh
LD_LIBRARY_PATH=$lib\${LD_LIBRARY_PATH:+:\$LD_LIBRARY_PATH} \\
  exec $root/root/usr/bin/gcc-15 --sysroot=$root/root \\
  -specs=$root/binutils.specs "\$@"
WRAPPER
chmod +x "$root/compiler"
"$root/compiler" --version | head -n 1
"$root/bin/objdump" --version | head -n 1
