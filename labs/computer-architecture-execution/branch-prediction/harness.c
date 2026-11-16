// Times sum_large on the same bytes in random and in sorted order. Rounds
// alternate which order goes first. Output: order,rep,ns_per_element,sum
#define _POSIX_C_SOURCE 200809L
#include <assert.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

uint64_t sum_large(const uint8_t *values, size_t count);

static double seconds(void) {
  struct timespec t;
  assert(clock_gettime(CLOCK_MONOTONIC, &t) == 0);
  return t.tv_sec + t.tv_nsec / 1e9;
}

int main(int argc, char **argv) {
  int quick = argc > 1 && strcmp(argv[1], "quick") == 0;
  size_t n = quick ? 1u << 16 : 1u << 22;
  int rounds = quick ? 1 : 7;
  uint8_t *random = malloc(n), *sorted = malloc(n);
  assert(random && sorted);
  uint64_t state = 0x2545f4914f6cdd1du, expected = 0;
  size_t counts[256] = {0};
  for (size_t i = 0; i < n; ++i) {
    state ^= state << 13;
    state ^= state >> 7;
    state ^= state << 17;
    random[i] = (uint8_t)state;
    counts[random[i]]++;
    if (random[i] >= 128) expected += random[i];
  }
  for (size_t v = 0, k = 0; v < 256; ++v)  // counting sort
    for (size_t c = 0; c < counts[v]; ++c) sorted[k++] = (uint8_t)v;
  for (int rep = 0; rep < rounds; ++rep)
    for (int turn = 0; turn < 2; ++turn) {
      int use_sorted = (rep + turn) % 2;
      const uint8_t *data = use_sorted ? sorted : random;
      double start = seconds();
      uint64_t sum = sum_large(data, n);
      double elapsed = seconds() - start;
      assert(sum == expected);
      printf("%s,%d,%.4f,%llu\n", use_sorted ? "sorted" : "random", rep,
             elapsed * 1e9 / (double)n, (unsigned long long)sum);
    }
  free(random);
  free(sorted);
  return 0;
}
