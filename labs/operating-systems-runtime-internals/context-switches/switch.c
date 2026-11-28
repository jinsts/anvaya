// switch: what a context switch costs, measured as lmbench does (OSTEP
// chapter 6): two tasks pinned to one CPU pass a byte back and forth through
// two pipes, so each round trip makes two switches. The same pipe work done
// by one process without switching is timed beside it and subtracted later.
// Each batch times three kinds, in an order that rotates every batch:
//   pipe       one process writes and reads both pipes itself: no switch
//   processes  a parent and a forked child
//   threads    two threads of one process
// For the two ping-pong kinds it also reads, from /proc/thread-self/status,
// how many voluntary and involuntary switches the measuring thread made.
//
// Usage: switch [round trips per batch] [batches]
// Output: kind,batch,ns_per_round_trip,round_trips,voluntary,involuntary
#define _GNU_SOURCE
#include <assert.h>
#include <pthread.h>
#include <sched.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/wait.h>
#include <time.h>
#include <unistd.h>

static int cpu;  // the one CPU every task runs on
static long trips;
static int ping[2], pong[2];

static long long now(void) {
  struct timespec t;
  assert(clock_gettime(CLOCK_MONOTONIC, &t) == 0);
  return (long long)t.tv_sec * 1000000000LL + t.tv_nsec;
}

static void pin(void) {
  cpu_set_t set;
  CPU_ZERO(&set);
  CPU_SET(cpu, &set);
  assert(sched_setaffinity(0, sizeof set, &set) == 0);
}

// The calling thread's switch counts so far.
static void switches(long *voluntary, long *involuntary) {
  FILE *file = fopen("/proc/thread-self/status", "r");
  assert(file);
  char line[256];
  while (fgets(line, sizeof line, file)) {
    sscanf(line, "voluntary_ctxt_switches: %ld", voluntary);
    sscanf(line, "nonvoluntary_ctxt_switches: %ld", involuntary);
  }
  fclose(file);
}

static void put(int fd, char byte) { assert(write(fd, &byte, 1) == 1); }
static char get(int fd) {
  char byte;
  assert(read(fd, &byte, 1) == 1);
  return byte;
}

// The other side: answer every byte on ping with the next one on pong.
static void echo(void) {
  for (long i = 0; i < trips; ++i) put(pong[1], (char)(get(ping[0]) + 1));
}
static void *echo_thread(void *unused) {
  (void)unused;
  pin();
  echo();
  return NULL;
}

// Times `trips` round trips from this side; checks every answer.
static void play(const char *kind, int batch) {
  long v0 = 0, i0 = 0, v1 = 0, i1 = 0;
  switches(&v0, &i0);
  long long start = now();
  for (long i = 0; i < trips; ++i) {
    put(ping[1], (char)i);
    assert(get(pong[0]) == (char)(i + 1));
  }
  long long elapsed = now() - start;
  switches(&v1, &i1);
  printf("%s,%d,%.1f,%ld,%ld,%ld\n", kind, batch, (double)elapsed / trips,
         trips, v1 - v0, i1 - i0);
}

static void pipes(int batch) {
  long long start = now();
  for (long i = 0; i < trips; ++i) {
    put(ping[1], (char)i);
    char byte = get(ping[0]);
    put(pong[1], (char)(byte + 1));
    assert(get(pong[0]) == (char)(i + 1));
  }
  long long elapsed = now() - start;
  printf("pipe,%d,%.1f,%ld,0,0\n", batch, (double)elapsed / trips, trips);
}

static void processes(int batch) {
  pid_t child = fork();
  assert(child >= 0);
  if (child == 0) {
    pin();
    echo();
    _exit(0);
  }
  play("processes", batch);
  int status;
  assert(waitpid(child, &status, 0) == child && WIFEXITED(status) &&
         WEXITSTATUS(status) == 0);
}

static void threads(int batch) {
  pthread_t thread;
  assert(pthread_create(&thread, NULL, echo_thread, NULL) == 0);
  play("threads", batch);
  assert(pthread_join(thread, NULL) == 0);
}

int main(int argc, char **argv) {
  trips = argc > 1 ? atol(argv[1]) : 100000;
  int batches = argc > 2 ? atoi(argv[2]) : 15;
  assert(trips > 0 && batches > 0);
  cpu_set_t set;
  assert(sched_getaffinity(0, sizeof set, &set) == 0);
  for (cpu = CPU_SETSIZE - 1; cpu >= 0 && !CPU_ISSET(cpu, &set); --cpu) {
  }
  assert(cpu >= 0);
  pin();
  assert(pipe(ping) == 0 && pipe(pong) == 0);
  setvbuf(stdout, NULL, _IOLBF, 0);
  void (*kinds[3])(int) = {pipes, processes, threads};
  for (int batch = 0; batch < batches; ++batch)
    for (int k = 0; k < 3; ++k) kinds[(batch + k) % 3](batch);
  return 0;
}
