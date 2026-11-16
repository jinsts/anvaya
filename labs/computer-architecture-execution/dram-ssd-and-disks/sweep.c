// Dependent pointer chasing across working sets of increasing size.
//
// Each node fills one 64-byte cache line. The visiting order is a random
// single cycle (Sattolo's algorithm), so every load depends on the previous
// one and the next address cannot be predicted by a prefetcher. The time per
// load therefore approaches the latency of whichever level holds the working
// set. Pages are the default 4 KiB, so large sets also include TLB misses.
//
// Repetitions are interleaved: each round visits every size, alternating
// ascending and descending order, so a slow period on a shared or virtual
// machine affects one repetition of many sizes rather than every repetition
// of a few. Each size rebuilds the same permutation, so its end index must
// match across rounds.
//
// Usage: sweep [quick]. Output: size_bytes,rep,loads,ns_per_load,end_index
#define _POSIX_C_SOURCE 200809L
#include <assert.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define LINE 64
struct node {
  struct node *next;
  char pad[LINE - sizeof(struct node *)];
};

static uint64_t state = 0x9e3779b97f4a7c15u;
static uint64_t next_random(void) {  // xorshift64*, fixed seed: reproducible
  state ^= state >> 12;
  state ^= state << 25;
  state ^= state >> 27;
  return state * 0x2545f4914f6cdd1du;
}

static double seconds(void) {
  struct timespec t;
  assert(clock_gettime(CLOCK_MONOTONIC, &t) == 0);
  return t.tv_sec + t.tv_nsec / 1e9;
}

int main(int argc, char **argv) {
  int quick = argc > 1 && strcmp(argv[1], "quick") == 0;
  // Two sizes per doubling from 4 KiB to 256 MiB, or four sizes when quick.
  size_t sizes[40];
  int count = 0;
  if (quick) {
    size_t q[] = {4096, 65536, 1u << 20, 16u << 20};
    for (int i = 0; i < 4; ++i) sizes[count++] = q[i];
  } else
    for (size_t s = 4096; s <= (256u << 20); s *= 2) {
      sizes[count++] = s;
      if (s < (256u << 20)) sizes[count++] = s + s / 2;
    }
  int reps = quick ? 1 : 5;
  for (int rep = 0; rep < reps; ++rep)
    for (int step = 0; step < count; ++step) {
      int k = rep % 2 ? count - 1 - step : step;
      size_t nodes = sizes[k] / LINE;
      state = 0x9e3779b97f4a7c15u ^ sizes[k];  // same permutation every round
      struct node *base = aligned_alloc(4096, nodes * sizeof *base);
      assert(base);
      size_t *order = malloc(nodes * sizeof *order);
      assert(order);
      for (size_t i = 0; i < nodes; ++i) order[i] = i;
      for (size_t i = nodes - 1; i > 0; --i) {  // Sattolo: one cycle
        size_t j = next_random() % i;
        size_t t = order[i];
        order[i] = order[j];
        order[j] = t;
      }
      for (size_t i = 0; i < nodes; ++i) base[i].next = &base[order[i]];
      free(order);
      // The cycle must visit every node once; the walk also touches every
      // page, so page faults are not timed.
      struct node *p = base;
      size_t length = 0;
      do {
        p = p->next;
        ++length;
      } while (p != base);
      assert(length == nodes);
      // At least four passes; one extra load makes the end index depend on
      // the permutation.
      size_t floor = quick ? 1u << 16 : 1u << 22;
      size_t loads = (nodes * 4 > floor ? nodes * 4 : floor) + 1;
      double start = seconds();
      for (size_t i = 0; i < loads; ++i) p = p->next;
      double elapsed = seconds() - start;
      printf("%zu,%d,%zu,%.4f,%zu\n", sizes[k], rep, loads,
             elapsed * 1e9 / (double)loads, (size_t)(p - base));
      free(base);
    }
  return 0;
}
