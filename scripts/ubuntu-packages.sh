#!/bin/sh
# Sourced by the setup-*.sh scripts: download Ubuntu packages without root and
# extract them into a folder (ADR 0010). By default apt-get uses this
# machine's package sources, which is how the recorded toolchains were made
# on Ubuntu 26.04. On another Ubuntu release, set ANVAYA_UBUNTU_SUITE to the
# recorded suite (resolute is 26.04): a private apt state in <folder>/apt then
# downloads from that suite, and the machine's apt configuration is untouched.
#
#   . scripts/ubuntu-packages.sh
#   ubuntu_extract /tmp/anvaya-strace strace
#
# The packages land in <folder>/debs and are extracted into <folder>/root.

# ubuntu_apt <folder> <apt-get arguments>: apt-get with the chosen sources.
ubuntu_apt() {
  folder=$1
  shift
  if [ -z "${ANVAYA_UBUNTU_SUITE:-}" ]; then
    apt-get "$@"
    return
  fi
  suite=$ANVAYA_UBUNTU_SUITE
  apt="$folder/apt"
  keyring=/usr/share/keyrings/ubuntu-archive-keyring.gpg
  # A folder reused for another suite gets a fresh package list.
  if [ "$(cat "$apt/suite" 2>/dev/null)" != "$suite" ]; then
    rm -rf "$apt"
    mkdir -p "$apt/lists/partial" "$apt/cache/archives/partial"
    echo "$suite" >"$apt/suite"
    : >"$apt/status"
    {
      echo "deb [signed-by=$keyring] http://archive.ubuntu.com/ubuntu $suite main universe"
      echo "deb [signed-by=$keyring] http://archive.ubuntu.com/ubuntu $suite-updates main universe"
      echo "deb [signed-by=$keyring] http://security.ubuntu.com/ubuntu $suite-security main universe"
    } >"$apt/sources.list"
    apt-get -o Dir::Etc::SourceList="$apt/sources.list" \
      -o Dir::Etc::SourceParts=/dev/null -o Dir::State="$apt" \
      -o Dir::State::Lists="$apt/lists" -o Dir::State::status="$apt/status" \
      -o Dir::Cache="$apt/cache" -o APT::Architecture=amd64 \
      -o APT::Architectures::=amd64 -q update >/dev/null
  fi
  apt-get -o Dir::Etc::SourceList="$apt/sources.list" \
    -o Dir::Etc::SourceParts=/dev/null -o Dir::State="$apt" \
    -o Dir::State::Lists="$apt/lists" -o Dir::State::status="$apt/status" \
    -o Dir::Cache="$apt/cache" -o APT::Architecture=amd64 \
    -o APT::Architectures::=amd64 "$@"
}

# ubuntu_extract <folder> <package>...: download and extract the packages.
ubuntu_extract() {
  mkdir -p "$1/debs" "$1/root"
  # Absolute, because apt-get runs from the debs folder.
  folder=$(cd "$1" && pwd)
  shift
  # A subshell keeps the caller's working directory.
  (cd "$folder/debs" && ubuntu_apt "$folder" download "$@")
  for package in "$folder"/debs/*.deb; do
    dpkg-deb -x "$package" "$folder/root"
  done
}
