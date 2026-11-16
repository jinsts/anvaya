// Two threads each increment their own counter. In one layout the counters
// share a 64-byte cache line; in the other each has a line to itself. No data
// is shared, so any slowdown comes from the cache line moving between cores.
// Output: layout,rep,ns_per_increment,check
#define _POSIX_C_SOURCE 200809L
#include <assert.h>
#include <pthread.h>
#include <stdalign.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <time.h>

struct adjacent {
  alignas(64) volatile uint64_t a;
  volatile uint64_t b;  // 8 bytes after a: the same line
};
struct padded {
  alignas(64) volatile uint64_t a;
  alignas(64) volatile uint64_t b;  // 64 bytes after a: its own line
};

static uint64_t iterations;
static void *count(void *arg) {
  volatile uint64_t *counter = arg;
  for (uint64_t i = 0; i < iterations; ++i) *counter = *counter + 1;
  return NULL;
}

static double seconds(void) {
  struct timespec t;
  assert(clock_gettime(CLOCK_MONOTONIC, &t) == 0);
  return t.tv_sec + t.tv_nsec / 1e9;
}

static double run(volatile uint64_t *a, volatile uint64_t *b) {
  *a = 0;
  *b = 0;
  pthread_t first, second;
  double start = seconds();
  assert(pthread_create(&first, NULL, count, (void *)a) == 0);
  assert(pthread_create(&second, NULL, count, (void *)b) == 0);
  assert(pthread_join(first, NULL) == 0);
  assert(pthread_join(second, NULL) == 0);
  double elapsed = seconds() - start;
  assert(*a == iterations && *b == iterations);
  return elapsed;
}

int main(int argc, char **argv) {
  int quick = argc > 1 && strcmp(argv[1], "quick") == 0;
  iterations = quick ? 100000 : 100000000;
  int rounds = quick ? 1 : 7;
  static struct adjacent near;
  static struct padded far;
  assert((uintptr_t)&near.b - (uintptr_t)&near.a == 8);
  assert((uintptr_t)&far.b - (uintptr_t)&far.a == 64);
  for (int rep = 0; rep < rounds; ++rep)
    for (int turn = 0; turn < 2; ++turn) {
      int padded = (rep + turn) % 2;
      double elapsed = padded ? run(&far.a, &far.b) : run(&near.a, &near.b);
      printf("%s,%d,%.4f,%llu\n", padded ? "padded" : "adjacent", rep,
             elapsed * 1e9 / (double)iterations,
             (unsigned long long)iterations);
    }
  return 0;
}
