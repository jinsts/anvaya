#!/bin/sh
# Recreates the compiler used for this subject's recorded artifacts without
# root access: GCC 15.2 and glibc headers from Ubuntu 26.04 packages, extracted
# into a local folder, plus a wrapper script. The system's binutils (as, ld,
# nm) assemble and link. Usage, from anywhere:
#
#   sh setup-gcc-ubuntu.sh /tmp/anvaya-cc
#   ANVAYA_CC=/tmp/anvaya-cc/compiler pnpm test
#
# On a machine with a matching gcc-15 installed, ANVAYA_CC=gcc-15 works too.
set -eu
root=${1:-/tmp/anvaya-cc}
mkdir -p "$root/debs" "$root/root"
# Absolute, because the steps below run from "$root/debs".
root=$(cd "$root" && pwd)
cd "$root/debs"
apt-get download gcc-15 gcc-15-x86-64-linux-gnu cpp-15 cpp-15-x86-64-linux-gnu \
  gcc-15-base libgcc-15-dev libc6-dev linux-libc-dev libcrypt-dev libisl23 \
  libmpc3 libmpfr6 libatomic1 libquadmath0 libgomp1
for package in *.deb; do dpkg-deb -x "$package" "$root/root"; done
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
cat > "$root/compiler" <<WRAPPER
#!/bin/sh
LD_LIBRARY_PATH=$lib\${LD_LIBRARY_PATH:+:\$LD_LIBRARY_PATH} \\
  exec $root/root/usr/bin/gcc-15 --sysroot=$root/root "\$@"
WRAPPER
chmod +x "$root/compiler"
"$root/compiler" --version | head -n 1
