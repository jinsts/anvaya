// Prints the x86-64 system-call numbers of the calls serve makes, from the
// C library's <sys/syscall.h>, which takes them from the kernel's headers.
// The lesson's call-path figure reads this program's recorded output.
#define _DEFAULT_SOURCE
#include <stdio.h>
#include <sys/syscall.h>

int main(void) {
  printf("read %d\n", SYS_read);
  printf("write %d\n", SYS_write);
  printf("openat %d\n", SYS_openat);
  printf("close %d\n", SYS_close);
  printf("getpid %d\n", SYS_getpid);
  printf("clock_gettime %d\n", SYS_clock_gettime);
  printf("exit_group %d\n", SYS_exit_group);
  return 0;
}
