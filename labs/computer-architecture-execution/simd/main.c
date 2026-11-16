#include <assert.h>
#include <stddef.h>

void add_arrays(int *restrict out, const int *restrict a,
                const int *restrict b, size_t n);
float sum_floats(const float *values, size_t n);

int main(void) {
  // Ten elements: two full vectors of four, then two in the remainder loop.
  int a[10], b[10], out[10];
  float values[10];
  for (int i = 0; i < 10; ++i) {
    a[i] = i;
    b[i] = 100 * i;
    values[i] = (float)i;  // small integers: every order gives the same sum
  }
  add_arrays(out, a, b, 10);
  for (int i = 0; i < 10; ++i) assert(out[i] == 101 * i);
  add_arrays(out, a, b, 0);
  assert(sum_floats(values, 10) == 45.0f);
  assert(sum_floats(values, 3) == 3.0f);
  return 0;
}
