// Calls a function from another file, so the caller cannot see which
// registers it uses and must follow the calling convention.
int sum_to(const int *values, int count);

int scale_sum(const int *values, int count, int factor) {
  return factor * sum_to(values, count);
}
