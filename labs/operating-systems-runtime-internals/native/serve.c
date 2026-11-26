// serve: this subject's running example, a tiny request handler. It reads a
// request from a file, checks how long that took, and writes one response
// line to standard output, which is usually a pipe. The system-calls lesson
// traces it; later lessons fork it, map its files, limit it and signal it,
// each through a mode of its own, so this default path stays the same.
//
//   ./serve request.txt   ->   serve: ok, 11 bytes
#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>
#include <time.h>
#include <unistd.h>

// Monotonic time in seconds. On x86-64 the C library answers this from the
// vDSO, so it normally needs no system call at all.
static double seconds(void) {
  struct timespec now;
  if (clock_gettime(CLOCK_MONOTONIC, &now) != 0) return -1;
  return (double)now.tv_sec + now.tv_nsec / 1e9;
}

// Writes the whole buffer, retrying short writes; returns 0 or -1.
static int write_all(int fd, const char *data, size_t length) {
  while (length > 0) {
    ssize_t written = write(fd, data, length);
    if (written < 0 && errno == EINTR) continue;
    if (written < 0) return -1;
    data += written;
    length -= (size_t)written;
  }
  return 0;
}

// Reports a failed step on standard error with one write. (perror would do
// too, but how it checks the stream is up to the C library's version, and
// this lesson's traces should show only serve's own system calls.)
static int fail(const char *what, int error) {
  char message[160];
  int length = snprintf(message, sizeof message, "serve: %s: %s\n", what,
                        strerror(error));
  if (length > 0) write_all(STDERR_FILENO, message, (size_t)length);
  return 1;
}

int main(int argc, char **argv) {
  const char *path = argc > 1 ? argv[1] : "request.txt";
  double start = seconds();

  // open, read until end of file, close: three kinds of system call.
  int fd = open(path, O_RDONLY);
  if (fd < 0) return fail(path, errno);
  char request[256];
  size_t total = 0;
  ssize_t got;
  while ((got = read(fd, request + total, sizeof request - 1 - total)) > 0)
    total += (size_t)got;
  int error = got < 0 ? errno : 0;
  if (close(fd) != 0 && error == 0) error = errno;
  if (error != 0) return fail(path, error);

  // A real service would refuse a request that took too long to read.
  double elapsed = seconds() - start;
  // The first process in a container is PID 1, which has duties of its own
  // (the containers chapter); serve only notes when it is one.
  int init = getpid() == 1;
  char response[128];
  int length = snprintf(response, sizeof response, "serve: %s, %zu bytes%s\n",
                        elapsed < 1.0 ? "ok" : "slow", total,
                        init ? " (as PID 1)" : "");
  if (length < 0 || write_all(STDOUT_FILENO, response, (size_t)length) != 0)
    return fail("write", errno);
  return 0;
}
