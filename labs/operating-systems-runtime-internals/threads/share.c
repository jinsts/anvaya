// share: what a thread shares with the rest of its process, and what a
// forked child gets a copy of, read from /proc/thread-self/status and tested
// with a global variable and a file descriptor. It forks while its second
// thread is still running. It prints comparisons and counts, never raw IDs,
// so its output is the same on every run.
#define _GNU_SOURCE
#include <errno.h>
#include <fcntl.h>
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/wait.h>
#include <unistd.h>

struct status {
  long tgid, pid, ppid, threads;
};

static int counter = 0;  // a global: part of the process's memory
static int thread_fd = -1;
static struct status thread_view;
static int ready[2], finish[2];  // pipes between the main thread and T

static void must(int ok, const char *what) {
  if (!ok) {
    fprintf(stderr, "share: %s: %s\n", what, strerror(errno));
    exit(2);
  }
}

// Tgid (the process ID), Pid (the thread ID), PPid and Threads for the
// calling thread, from /proc/thread-self/status.
static struct status read_status(void) {
  struct status s = {-1, -1, -1, -1};
  FILE *file = fopen("/proc/thread-self/status", "r");
  must(file != NULL, "open /proc/thread-self/status");
  char line[256];
  while (fgets(line, sizeof line, file)) {
    sscanf(line, "Tgid: %ld", &s.tgid);
    sscanf(line, "Pid: %ld", &s.pid);
    sscanf(line, "PPid: %ld", &s.ppid);
    sscanf(line, "Threads: %ld", &s.threads);
  }
  fclose(file);
  return s;
}

static void *second_thread(void *unused) {
  (void)unused;
  thread_view = read_status();
  counter = 42;
  thread_fd = open("/dev/null", O_WRONLY);
  char byte = 1;
  must(write(ready[1], &byte, 1) == 1, "write ready");
  // Stay alive until the main thread has forked.
  must(read(finish[0], &byte, 1) == 1, "read finish");
  return NULL;
}

static const char *same(long a, long b) { return a == b ? "same" : "different"; }

int main(void) {
  setvbuf(stdout, NULL, _IONBF, 0);  // nothing buffered is copied by fork
  must(pipe(ready) == 0 && pipe(finish) == 0, "pipe");
  struct status main_view = read_status();
  printf("main thread: Threads %ld\n", main_view.threads);

  pthread_t thread;
  must(pthread_create(&thread, NULL, second_thread, NULL) == 0,
       "pthread_create");
  char byte;
  must(read(ready[0], &byte, 1) == 1, "read ready");
  printf("thread T: process ID %s as main's, thread ID %s; Threads %ld\n",
         same(thread_view.tgid, main_view.tgid),
         same(thread_view.pid, main_view.pid), thread_view.threads);
  printf("T set counter to 42; main reads %d\n", counter);
  printf("T opened descriptor %d; main writes to it: %s\n", thread_fd,
         write(thread_fd, "x", 1) == 1 ? "ok" : strerror(errno));

  pid_t child = fork();
  must(child >= 0, "fork");
  if (child == 0) {
    struct status child_view = read_status();
    printf("child: process ID %s, parent is main's process: %s; Threads %ld\n",
           same(child_view.tgid, main_view.tgid),
           child_view.ppid == main_view.tgid ? "yes" : "no",
           child_view.threads);
    counter = 7;
    int fd = open("/dev/null", O_WRONLY);
    printf("child set counter to 7 and opened descriptor %d; it still has "
           "descriptor %d: %s\n",
           fd, thread_fd, fcntl(thread_fd, F_GETFD) >= 0 ? "yes" : "no");
    _exit(fd);
  }
  int status;
  must(waitpid(child, &status, 0) == child, "waitpid");
  int child_fd = WEXITSTATUS(status);
  printf("after the child: main reads counter %d; descriptor %d in main: %s\n",
         counter, child_fd,
         fcntl(child_fd, F_GETFD) >= 0 ? "open" : "not open");

  must(write(finish[1], "x", 1) == 1, "write finish");
  must(pthread_join(thread, NULL) == 0, "pthread_join");
  printf("after T exits: Threads %ld\n", read_status().threads);
  return 0;
}
