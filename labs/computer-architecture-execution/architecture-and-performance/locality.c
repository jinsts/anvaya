#define _POSIX_C_SOURCE 200809L
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <assert.h>
static double seconds(void) {
  struct timespec t;
  assert(clock_gettime(CLOCK_MONOTONIC, &t) == 0);
  return t.tv_sec + t.tv_nsec / 1e9;
}
int main(void) {
  const size_t n = 2048;
  uint32_t *a = malloc(n * n * sizeof *a);
  assert(a);
  uint64_t expected = 0;
  for (size_t i = 0; i < n * n; ++i) { a[i] = i % 251; expected += a[i]; }
  for (int run = 0; run < 6; ++run) {
    for (int turn = 0; turn < 2; ++turn) {
      int columns = (run + turn) % 2;
      uint64_t sum = 0;
      double start = seconds();
      if (columns) {
        for (size_t col = 0; col < n; ++col)
          for (size_t row = 0; row < n; ++row) sum += a[row * n + col];
      } else {
        for (size_t row = 0; row < n; ++row)
          for (size_t col = 0; col < n; ++col) sum += a[row * n + col];
      }
      double elapsed = seconds() - start;
      assert(sum == expected);
      printf("%d,%s,%.9f,%llu\n", run, columns ? "columns" : "rows", elapsed, (unsigned long long)sum);
    }
  }
  free(a);
}
