#include <assert.h>
unsigned bump(unsigned *value) { return ++*value; }
int main(void) {
  unsigned value = 7;
  assert(bump(&value) == 8);
  assert(value == 8);
  return 0;
}
