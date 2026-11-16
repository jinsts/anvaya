#include <assert.h>
int sum_to(const int *values, int count);
int scale_sum(const int *values, int count, int factor);

int main(void) {
  int values[] = {3, 5, 7, 9};
  assert(sum_to(values, 4) == 24);
  assert(sum_to(values, 0) == 0);
  assert(scale_sum(values, 4, 2) == 48);
  return 0;
}
