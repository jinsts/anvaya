// Sums the bytes at or above 128. The native lab compiles this one file three
// ways, so the same C source becomes a vectorized loop, a branch-free loop
// with a conditional move, or a loop with a real conditional branch.
#include <stddef.h>
#include <stdint.h>

uint64_t sum_large(const uint8_t *values, size_t count) {
  uint64_t sum = 0;
  for (size_t i = 0; i < count; ++i)
    if (values[i] >= 128) sum += values[i];
  return sum;
}
