// Checks atomics.c with real threads: the consumer always sees the published
// value, and two threads' atomic increments are never lost.
#include <assert.h>
#include <pthread.h>

extern int data;
extern int ready;
extern int hits;
void publish(int value);
int consume(void);
void count_hit(void);

enum { ROUNDS = 2000, INCREMENTS = 1000000 };

static void *reader(void *seen) {
  *(int *)seen = consume();
  return 0;
}

static void *counter(void *unused) {
  (void)unused;
  for (int i = 0; i < INCREMENTS; i++) count_hit();
  return 0;
}

int main(void) {
  for (int round = 1; round <= ROUNDS; round++) {
    __atomic_store_n(&ready, 0, __ATOMIC_SEQ_CST);
    data = 0;
    int seen = -1;
    pthread_t thread;
    assert(pthread_create(&thread, 0, reader, &seen) == 0);
    publish(round);
    assert(pthread_join(thread, 0) == 0);
    assert(seen == round);
  }
  pthread_t a, b;
  assert(pthread_create(&a, 0, counter, 0) == 0);
  assert(pthread_create(&b, 0, counter, 0) == 0);
  assert(pthread_join(a, 0) == 0 && pthread_join(b, 0) == 0);
  assert(__atomic_load_n(&hits, __ATOMIC_SEQ_CST) == 2 * INCREMENTS);
  return 0;
}
