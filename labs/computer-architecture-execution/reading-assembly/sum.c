// Adds count ints. Compiled separately from scale.c, as a library would be.
int sum_to(const int *values, int count) {
  int total = 0;
  for (int i = 0; i < count; ++i) total += values[i];
  return total;
}
