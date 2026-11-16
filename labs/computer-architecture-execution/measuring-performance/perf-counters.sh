#!/usr/bin/env bash
# Owner-run: counts hardware events for the recorded experiments with perf
# stat on native Linux. Nothing here runs in the quality gate, and the lesson
# shows no counter output until this script's results are reviewed.
#
#   bash labs/computer-architecture-execution/measuring-performance/perf-counters.sh
#
# Writes one file per program to perf-output/ next to this script. Set
# ANVAYA_CC to choose the compiler (default: cc) and ANVAYA_CPU to pin the
# runs to one CPU (default: 0), so a hybrid processor counts one core type.
set -euo pipefail
if ! command -v perf >/dev/null 2>&1; then
  echo "perf is not installed; install your distribution's perf package (often linux-tools) and rerun." >&2
  exit 2
fi
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
subject="$(dirname "$here")"
cc="${ANVAYA_CC:-cc}"
cpu="${ANVAYA_CPU:-0}"

paranoid_file=/proc/sys/kernel/perf_event_paranoid
if [ -r "$paranoid_file" ] && [ "$(cat "$paranoid_file")" -gt 2 ]; then
  echo "perf_event_paranoid is $(cat "$paranoid_file"); counting your own processes needs 2 or lower, or CAP_PERFMON." >&2
  exit 3
fi

out="$here/perf-output"
mkdir -p "$out"
build="$(mktemp -d)"
trap 'rm -rf "$build"' EXIT
"$cc" -std=c17 -O2 -fno-loop-interchange "$subject/architecture-and-performance/locality.c" -o "$build/locality"
"$cc" -std=c17 -O2 "$here/timing.c" -o "$build/timing"

stamp="$(date -u +%Y-%m-%dT%H%M%SZ)"
events=cycles,instructions,branches,branch-misses,cache-references,cache-misses
for program in locality timing; do
  file="$out/$stamp-$program.txt"
  {
    echo "# $(uname -srm); $("$cc" --version | head -n 1); CPU $cpu"
    grep -m 1 'model name' /proc/cpuinfo || true
  } >"$file"
  perf stat -r 5 -e "$events" --append -o "$file" -- \
    taskset -c "$cpu" "$build/$program" >/dev/null
  echo "wrote $file"
done
