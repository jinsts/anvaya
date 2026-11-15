// Prints how this target lays out multi-byte data: integer and floating-point
// bytes in address order, the UTF-8 bytes of a string literal, and the
// offsets the ABI gives one record's fields in two orders.
#include <assert.h>
#include <stdalign.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

static void bytes(const char *label, const void *data, size_t size) {
  const unsigned char *p = data;
  printf("%s:", label);
  for (size_t i = 0; i < size; ++i) printf(" %02x", p[i]);
  printf("\n");
}

struct declared { char tag; double ratio; char flag; int32_t count; };
struct reordered { double ratio; int32_t count; char tag; char flag; };

#define FIELD(type, name) printf(" %s@%zu", #name, offsetof(type, name))

int main(void) {
  uint32_t word = 0x12345678;
  float tenth32 = 0.1f;
  double tenth64 = 0.1;
  const char text[] = "A\U0001F642é";
  bytes("uint32 0x12345678", &word, sizeof word);
  bytes("float 0.1f", &tenth32, sizeof tenth32);
  bytes("double 0.1", &tenth64, sizeof tenth64);
  bytes("utf8 A U+1F642 e U+0301", text, strlen(text));

  printf("declared: size %zu align %zu", sizeof(struct declared),
         alignof(struct declared));
  FIELD(struct declared, tag); FIELD(struct declared, ratio);
  FIELD(struct declared, flag); FIELD(struct declared, count);
  printf("\nreordered: size %zu align %zu", sizeof(struct reordered),
         alignof(struct reordered));
  FIELD(struct reordered, ratio); FIELD(struct reordered, count);
  FIELD(struct reordered, tag); FIELD(struct reordered, flag);
  printf("\n");
  // An array of records needs each element aligned, so size is a multiple
  // of the record's alignment.
  assert(sizeof(struct declared) % alignof(struct declared) == 0);
  assert(sizeof(struct reordered) % alignof(struct reordered) == 0);
  return 0;
}
