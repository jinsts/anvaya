// Times the same sum of a 4 MiB array many times, alternating a "warm" run
// (the previous run just read the array) with a "cold" run after a 64 MiB
// sweep has evicted it from the caches. Every sum is checked.
// Output: state,round,ns_per_element,checksum
#define _POSIX_C_SOURCE 200809L
#include <assert.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

enum { ELEMENTS = 1 << 20, SWEEP_BYTES = 64 << 20 };

static double seconds(void) {
  struct timespec t;
  assert(clock_gettime(CLOCK_MONOTONIC, &t) == 0);
  return t.tv_sec + t.tv_nsec / 1e9;
}

static uint64_t sum(const uint32_t *values) {
  uint64_t total = 0;
  for (size_t i = 0; i < ELEMENTS; ++i) total += values[i];
  return total;
}

// Reads one byte per 64-byte line of a large buffer to evict the array.
static uint64_t sweep(const volatile unsigned char *buffer) {
  uint64_t total = 0;
  for (size_t i = 0; i < SWEEP_BYTES; i += 64) total += buffer[i];
  return total;
}

int main(int argc, char **argv) {
  int rounds = argc > 1 && strcmp(argv[1], "quick") == 0 ? 2 : 30;
  uint32_t *values = malloc(sizeof *values * ELEMENTS);
  unsigned char *buffer = malloc(SWEEP_BYTES);
  assert(values && buffer);
  uint64_t expected = 0;
  for (size_t i = 0; i < ELEMENTS; ++i) {
    values[i] = (uint32_t)(i * 2654435761u >> 7);
    expected += values[i];
  }
  memset(buffer, 1, SWEEP_BYTES);
  for (int round = 0; round < rounds; ++round) {
    for (int cold = 1; cold >= 0; --cold) {
      if (cold) assert(sweep(buffer) == SWEEP_BYTES / 64);
      double start = seconds();
      uint64_t total = sum(values);
      double elapsed = seconds() - start;
      assert(total == expected);
      printf("%s,%d,%.4f,%llu\n", cold ? "cold" : "warm", round,
             elapsed * 1e9 / ELEMENTS, (unsigned long long)total);
    }
  }
  free(buffer);
  free(values);
  return 0;
}
