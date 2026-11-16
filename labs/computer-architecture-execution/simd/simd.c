// Two loops for the vectorizer. restrict promises that the arrays do not
// overlap, which lets the compiler process several elements at once.
#include <stddef.h>

void add_arrays(int *restrict out, const int *restrict a,
                const int *restrict b, size_t n) {
  for (size_t i = 0; i < n; ++i) out[i] = a[i] + b[i];
}

float sum_floats(const float *values, size_t n) {
  float sum = 0;
  for (size_t i = 0; i < n; ++i) sum += values[i];
  return sum;
}
