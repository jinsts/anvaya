#!/bin/sh
# Recreates OpenJDK 21, which compiles and runs the JVM programs and produces
# their javap listings, without root access: Ubuntu's headless JDK packages
# extracted into a local folder. Usage, from anywhere:
#
#   sh scripts/setup-jdk-ubuntu.sh /tmp/anvaya-jdk
#   ANVAYA_JAVA_HOME=/tmp/anvaya-jdk/root/usr/lib/jvm/java-21-openjdk-amd64 pnpm test
#
# The recorded listings came from 21.0.13.1. Ubuntu 26.04's build of it needs
# glibc 2.42, so on an older release take that release's own build of the
# same version: set ANVAYA_UBUNTU_SUITE to this machine's suite (for example
# noble), which also works when the machine's package lists are stale.
set -eu
here=$(cd "$(dirname "$0")" && pwd)
. "$here/ubuntu-packages.sh"
root=${1:-/tmp/anvaya-jdk}
mkdir -p "$root"
root=$(cd "$root" && pwd)
ubuntu_extract "$root" openjdk-21-jdk-headless openjdk-21-jre-headless
# Debian links the JDK's configuration into /etc by absolute paths; point
# those links at the extracted copies so the JDK needs nothing installed.
find "$root/root/usr/lib/jvm" -type l | while read -r link; do
  target=$(readlink "$link")
  case $target in
  /etc/*) ln -sfn "$root/root$target" "$link" ;;
  esac
done
home="$root/root/usr/lib/jvm/java-21-openjdk-amd64"
env -u JAVA_TOOL_OPTIONS -u _JAVA_OPTIONS -u JDK_JAVA_OPTIONS \
  "$home/bin/javac" -version
echo "Set ANVAYA_JAVA_HOME=$home"
