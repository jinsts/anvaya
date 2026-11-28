// Times two calls that look alike from C. getpid() enters the kernel every
// time (glibc 2.25 and later cache nothing); clock_gettime(CLOCK_MONOTONIC)
// is answered by the vDSO in user space where the clock source allows it.
// Each round times both, swapping which goes first, and every result is
// checked. Usage: cost [calls per batch] [rounds]
// Output: call,round,ns_per_call,calls
#define _POSIX_C_SOURCE 200809L
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <unistd.h>

static double now(void) {
  struct timespec t;
  assert(clock_gettime(CLOCK_MONOTONIC, &t) == 0);
  return (double)t.tv_sec * 1e9 + (double)t.tv_nsec;
}

static double time_getpid(long calls) {
  pid_t me = getpid();
  long same = 0;
  double start = now();
  for (long i = 0; i < calls; ++i) same += getpid() == me;
  double elapsed = now() - start;
  assert(same == calls);
  return elapsed / (double)calls;
}

static double time_clock(long calls) {
  struct timespec t, previous = {0, 0};
  long ordered = 0;
  double start = now();
  for (long i = 0; i < calls; ++i) {
    assert(clock_gettime(CLOCK_MONOTONIC, &t) == 0);
    // A monotonic clock never goes backwards.
    ordered += t.tv_sec > previous.tv_sec ||
               (t.tv_sec == previous.tv_sec && t.tv_nsec >= previous.tv_nsec);
    previous = t;
  }
  double elapsed = now() - start;
  assert(ordered == calls);
  return elapsed / (double)calls;
}

int main(int argc, char **argv) {
  long calls = argc > 1 ? atol(argv[1]) : 1000000;
  int rounds = argc > 2 ? atoi(argv[2]) : 15;
  assert(calls > 0 && rounds > 0);
  for (int round = 0; round < rounds; ++round)
    for (int turn = 0; turn < 2; ++turn) {
      int clock_first = round % 2;
      int clock_now = turn == 0 ? clock_first : !clock_first;
      double ns = clock_now ? time_clock(calls) : time_getpid(calls);
      printf("%s,%d,%.2f,%ld\n", clock_now ? "clock_gettime" : "getpid", round,
             ns, calls);
    }
  return 0;
}
