// launcher: starts serve the way a server starts a worker per request, then
// shows what happens to a child whose exec fails and to a grandchild whose
// parent exits first. It is the lesson model's LAUNCHER program run for real.
// Process IDs differ on every run, so it prints the names P1 to P5 instead;
// every line comes from P1 after the step it describes, so the output is the
// same each time. It needs ./serve and request.txt in its working folder.
#define _GNU_SOURCE
#include <errno.h>
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/prctl.h>
#include <sys/wait.h>
#include <unistd.h>

static void say(const char *format, ...) {
  va_list args;
  va_start(args, format);
  vprintf(format, args);
  va_end(args);
  putchar('\n');
  // Flush before every fork, so no child inherits unwritten output.
  fflush(stdout);
}

static void must(int ok, const char *what) {
  if (!ok) {
    fprintf(stderr, "launcher: %s: %s\n", what, strerror(errno));
    exit(2);
  }
}

// The process state letter from /proc/<pid>/stat: R, S, Z and so on.
static char state_of(pid_t pid) {
  char path[64], line[256];
  snprintf(path, sizeof path, "/proc/%d/stat", (int)pid);
  FILE *file = fopen(path, "r");
  if (!file) return '-';
  char *ok = fgets(line, sizeof line, file);
  fclose(file);
  char *close = ok ? strrchr(line, ')') : NULL;
  return close && close[1] == ' ' ? close[2] : '?';
}

static const char *ended(int status, char *buffer, size_t size) {
  if (WIFEXITED(status))
    snprintf(buffer, size, "exited with status %d", WEXITSTATUS(status));
  else
    snprintf(buffer, size, "ended by signal %d", WTERMSIG(status));
  return buffer;
}

int main(void) {
  char text[64];
  int status;
  pid_t me = getpid();
  // Orphans of P1's descendants come to P1 instead of to init.
  must(prctl(PR_SET_CHILD_SUBREAPER, 1) == 0, "PR_SET_CHILD_SUBREAPER");
  say("P1 is a child subreaper");

  // P2: fork, then exec serve. Its output appears before P1 reaps it.
  say("P1 forks P2, which execs ./serve request.txt");
  pid_t p2 = fork();
  must(p2 >= 0, "fork");
  if (p2 == 0) {
    execl("./serve", "serve", "request.txt", (char *)NULL);
    _exit(127);
  }
  must(waitpid(p2, &status, 0) == p2, "waitpid P2");
  say("P1 reaps P2: %s", ended(status, text, sizeof text));

  // P3: exec fails, so the code after it runs and exits with 127.
  say("P1 forks P3, which execs ./missing");
  pid_t p3 = fork();
  must(p3 >= 0, "fork");
  if (p3 == 0) {
    execl("./missing", "missing", (char *)NULL);
    int error = errno;
    printf("P3: exec failed (%s), so P3 runs on and exits with 127\n",
           strerror(error));
    fflush(stdout);
    _exit(127);
  }
  // Wait for P3 to exit but leave it unreaped (WNOWAIT): a zombie.
  siginfo_t info;
  must(waitid(P_PID, (id_t)p3, &info, WEXITED | WNOWAIT) == 0, "waitid P3");
  say("P3 has exited (status %d) and is not reaped: /proc/P3/stat shows %c",
      info.si_status, state_of(p3));
  must(waitpid(p3, &status, 0) == p3, "waitpid P3");
  say("P1 reaps P3: %s; /proc/P3 %s", ended(status, text, sizeof text),
      state_of(p3) == '-' ? "is gone" : "still exists");

  // P4 forks P5 and exits at once; P5 is orphaned and adopted by P1.
  say("P1 forks P4, which forks P5 and exits");
  int channel[2];
  must(pipe(channel) == 0, "pipe");
  pid_t p4 = fork();
  must(p4 >= 0, "fork");
  if (p4 == 0) {
    pid_t parent = getpid();
    pid_t p5 = fork();
    if (p5 == 0) {
      // Wait until P4 has gone, then report whose child P5 now is.
      while (getppid() == parent) usleep(1000);
      _exit(getppid() == me ? 0 : 1);
    }
    must(write(channel[1], &p5, sizeof p5) == sizeof p5, "write");
    _exit(0);
  }
  pid_t p5;
  must(read(channel[0], &p5, sizeof p5) == sizeof p5, "read");
  must(waitpid(p4, &status, 0) == p4, "waitpid P4");
  say("P1 reaps P4: %s", ended(status, text, sizeof text));
  // P1 can wait for P5 only because P5 is now P1's child.
  must(waitpid(p5, &status, 0) == p5, "waitpid P5");
  // P5 exits with 0 when it found P1 as its new parent, 1 otherwise.
  say("P1 reaps P5: %s, so P5's new parent %s P1",
      ended(status, text, sizeof text),
      WIFEXITED(status) && WEXITSTATUS(status) == 0 ? "was" : "was not");
  return 0;
}
