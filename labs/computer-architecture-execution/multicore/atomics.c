// Publishing a value with release/acquire, and counting with an atomic
// read-modify-write, written with GCC's __atomic builtins. The native lab
// records each function's x86-64 and AArch64 listing at -O2.

int data;
int ready;
int hits;

void publish(int value) {
  data = value;
  __atomic_store_n(&ready, 1, __ATOMIC_RELEASE);
}

int consume(void) {
  while (__atomic_load_n(&ready, __ATOMIC_ACQUIRE) == 0) {
  }
  return data;
}

void publish_seq_cst(int value) {
  data = value;
  __atomic_store_n(&ready, 1, __ATOMIC_SEQ_CST);
}

void count_hit(void) { __atomic_fetch_add(&hits, 1, __ATOMIC_RELAXED); }
