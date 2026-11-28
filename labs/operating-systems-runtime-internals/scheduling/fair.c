// fair: how Linux shares one CPU between busy processes with different nice
// values, and how late a process that mostly sleeps runs after its timer
// fires while a busy process holds the same CPU. Every child is pinned to
// the same CPU, so they compete for it; raising one's own nice value and
// choosing a CPU need no privileges.
//
// Usage: fair [milliseconds per share run] [wake-ups per run] [rounds]
// Output, one line per result:
//   share,<round>,<nice A>,<nice B>,<A's CPU us>,<B's CPU us>,<run's us>
//   wake,<round>,<busy neighbour 0|1>,<nanoseconds late>
// Each round runs the share pairs 0/0 and 0/5 and the wake test without and
// with a busy neighbour, swapping the order every round.
#define _GNU_SOURCE
#include <assert.h>
#include <sched.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/prctl.h>
#include <sys/resource.h>
#include <sys/time.h>
#include <sys/wait.h>
#include <time.h>
#include <unistd.h>

enum { PERIOD_NS = 10000000, WORK_NS = 1000000, MAX_WAKES = 10000 };

static int cpu;  // the one CPU every child runs on

static long long now(void) {
  struct timespec t;
  assert(clock_gettime(CLOCK_MONOTONIC, &t) == 0);
  return (long long)t.tv_sec * 1000000000LL + t.tv_nsec;
}

static void sleep_until(long long when) {
  struct timespec t = {when / 1000000000LL, when % 1000000000LL};
  while (clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, &t, NULL) != 0) {
  }
}

static void spin_until(long long when) {
  while (now() < when) {
  }
}

// In a new child: run on the shared CPU at the given nice value.
static void enter(int nice) {
  cpu_set_t set;
  CPU_ZERO(&set);
  CPU_SET(cpu, &set);
  assert(sched_setaffinity(0, sizeof set, &set) == 0);
  assert(setpriority(PRIO_PROCESS, 0, nice) == 0);
  assert(getpriority(PRIO_PROCESS, 0) == nice);
}

static pid_t busy(int nice, long long start, long long end) {
  pid_t child = fork();
  assert(child >= 0);
  if (child == 0) {
    enter(nice);
    sleep_until(start);
    spin_until(end);
    _exit(0);
  }
  return child;
}

// CPU time a child used, from the kernel's accounting, after it exits.
static long long reap(pid_t child) {
  int status;
  struct rusage usage;
  assert(wait4(child, &status, 0, &usage) == child);
  assert(WIFEXITED(status) && WEXITSTATUS(status) == 0);
  return (long long)(usage.ru_utime.tv_sec + usage.ru_stime.tv_sec) * 1000000 +
         usage.ru_utime.tv_usec + usage.ru_stime.tv_usec;
}

static void share(int round, int nice_b, long long ms) {
  long long start = now() + 50000000LL, end = start + ms * 1000000LL;
  pid_t a = busy(0, start, end), b = busy(nice_b, start, end);
  long long cpu_a = reap(a), cpu_b = reap(b);
  // Two processes on one CPU can never use more than the time that passed.
  assert(cpu_a + cpu_b <= ms * 1000 + 20000);
  printf("share,%d,0,%d,%lld,%lld,%lld\n", round, nice_b, cpu_a, cpu_b,
         ms * 1000);
}

// A child that sleeps until each 10 ms mark, notes how late it woke, and
// then works for 1 ms; with or without a busy neighbour on its CPU.
static void wake(int round, int neighbour, int wakes) {
  long long start = now() + 50000000LL;
  long long end = start + (long long)(wakes + 1) * PERIOD_NS;
  pid_t other = neighbour ? busy(0, start, end) : -1;
  int out[2];
  assert(pipe(out) == 0);
  pid_t sleeper = fork();
  assert(sleeper >= 0);
  if (sleeper == 0) {
    enter(0);
    // Ask the kernel not to delay the timer to batch wake-ups (the default
    // slack is 50 microseconds), so lateness is the scheduler's.
    assert(prctl(PR_SET_TIMERSLACK, 1UL, 0, 0, 0) == 0);
    static long long late[MAX_WAKES];
    for (int i = 0; i < wakes; ++i) {
      long long target = start + (long long)(i + 1) * PERIOD_NS;
      sleep_until(target);
      late[i] = now() - target;
      spin_until(now() + WORK_NS);
    }
    assert(write(out[1], late, sizeof late[0] * wakes) ==
           (ssize_t)(sizeof late[0] * wakes));
    _exit(0);
  }
  close(out[1]);
  static long long late[MAX_WAKES];
  size_t got = 0, want = sizeof late[0] * wakes;
  while (got < want) {
    ssize_t n = read(out[0], (char *)late + got, want - got);
    assert(n > 0);
    got += (size_t)n;
  }
  close(out[0]);
  reap(sleeper);
  if (other > 0) reap(other);
  for (int i = 0; i < wakes; ++i) {
    assert(late[i] >= 0);
    printf("wake,%d,%d,%lld\n", round, neighbour, late[i]);
  }
}

int main(int argc, char **argv) {
  long long ms = argc > 1 ? atoll(argv[1]) : 2000;
  int wakes = argc > 2 ? atoi(argv[2]) : 100;
  int rounds = argc > 3 ? atoi(argv[3]) : 5;
  assert(ms > 0 && wakes > 0 && wakes <= MAX_WAKES && rounds > 0);
  // The highest CPU this process may use.
  cpu_set_t set;
  assert(sched_getaffinity(0, sizeof set, &set) == 0);
  for (cpu = CPU_SETSIZE - 1; cpu >= 0 && !CPU_ISSET(cpu, &set); --cpu) {
  }
  assert(cpu >= 0);
  setvbuf(stdout, NULL, _IOLBF, 0);
  for (int round = 0; round < rounds; ++round) {
    int flip = round % 2;
    share(round, flip ? 5 : 0, ms);
    share(round, flip ? 0 : 5, ms);
    wake(round, flip, wakes);
    wake(round, !flip, wakes);
  }
  return 0;
}
