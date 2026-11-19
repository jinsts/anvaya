---
title: Operating Systems & Runtime Internals curriculum proposal
status: draft
drafter: agent
proposedDate: 2026-11-17
basedOnCommit: cdfa711
---

# Operating Systems & Runtime Internals curriculum proposal

A create-subject proposal, the dry run requested with the skill. It changes no
path, subject or lesson file. Approval, edits or reordering come from the
owner; then a separate planning change applies it. It starts from the
[2026-11-17 outline audit](../reviews/operating-systems-runtime-internals-audit-2026-11-17.md)
and resolves its findings. IDs refer to
[SUBJECT_STANDARD.md](../SUBJECT_STANDARD.md).

## Intake

| Question           | Owner's answer                                                                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Subject            | Operating Systems & Runtime Internals (`operating-systems-runtime-internals`)                                                                                                                                                   |
| Goals              | Diagnose production issues; handle interview deep dives; design better services; build small implementations                                                                                                                    |
| Current level      | Some theory: studied OS concepts once, rusty, not production-grounded                                                                                                                                                           |
| Roles, interviews  | Senior backend, staff/principal, platform/infra/SRE, software architect                                                                                                                                                         |
| Depth              | Interview-ready, plus toy implementations in labs; no kernel hacking                                                                                                                                                            |
| Languages          | No near-duplicate languages; in-demand and future-proof. TypeScript models in the gate; Node.js, the JVM and Go as **three full runtime case studies** (chosen after the agent offered two deep and one light). Python dropped. |
| Hardware and tools | This WSL2 machine only; Docker for containers; root or sudo allowed                                                                                                                                                             |
| Exclusions         | Keep the JVM and Node.js; add containers; filesystems only as far as services need them (descriptors, page cache, `fsync`)                                                                                                      |
| Sources            | Registered sources, official runtime documentation, Brendan Gregg's material                                                                                                                                                    |
| Time               | 6–10 hours a week                                                                                                                                                                                                               |
| Checkpoints        | Pause after every lesson                                                                                                                                                                                                        |

## Scope and boundary (C2)

The subject teaches how the Linux kernel and three language runtimes share
CPUs, memory and I/O among programs, and how to read the evidence they leave.
It starts where [Computer Architecture & Execution](../../src/content/subjects/computer-architecture-execution.yaml)
stops. Architecture showed what the hardware does at a privilege boundary, a
TLB miss or an atomic instruction; this subject shows what the kernel and the
runtimes build on top.

| Topic                                                                          | Owner                                                                                                                                       |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Privilege, traps, interrupts, DMA, TLB, caches, coherence, atomic instructions | Architecture (drafted); linked, not re-taught                                                                                               |
| Stack frames, heap lifetimes, tracing GC basics                                | Architecture's [stack-and-heap](../../src/content/lessons/computer-architecture-execution/stack-and-heap.mdx); runtime GC pages build on it |
| Socket semantics (backlog, partial reads, half-close), TCP                     | Networking; this subject owns readiness and completion APIs                                                                                 |
| Storage engines' use of `fsync`, WAL                                           | Databases; this subject owns what `fsync` and the page cache promise                                                                        |
| Cross-service logs, metrics, traces, SLOs, load testing                        | Security, Performance & Reliability; this subject owns per-host tools                                                                       |
| Filesystem implementation (inodes, journaling internals)                       | Out of scope (owner's exclusion)                                                                                                            |
| Kernel development, drivers, writing a kernel                                  | Out of scope                                                                                                                                |
| Python runtime                                                                 | Out of scope (owner's choice); one paragraph on the GIL in the comparison page                                                              |

## Coverage map (C1)

| Competency or interview deep dive                         | Lesson(s) | Assessed by                                     |
| --------------------------------------------------------- | --------- | ----------------------------------------------- |
| What happens when a process reads a file                  | 1, 15, 18 | syscall-trace lab; fd-table lab                 |
| `fork`/`exec`, zombies, copy-on-write                     | 2, 7      | process-tree lab; CoW fault lab                 |
| Threads vs processes; what a context switch costs         | 3, 5      | sharing lab; measured ping-pong                 |
| How the scheduler shares a CPU                            | 4         | fair-scheduler lab                              |
| Virtual memory, page faults, resident memory, OOM         | 6–8, 21   | translation, CoW and RSS/PSS labs; OOM evidence |
| Why memory is not returned                                | 9         | allocator lab                                   |
| Races, locks, condition variables, deadlock               | 10–14     | interleaving, mutex, queue and deadlock labs    |
| Blocking vs readiness vs completion I/O                   | 16, 17    | readiness and ring labs                         |
| Durability and `fsync`                                    | 18        | crash-outcome lab                               |
| Containers: namespaces, cgroups, limits                   | 19–21     | namespace, quota and OOM labs                   |
| Signals and graceful shutdown                             | 22        | signal-disposition lab                          |
| Diagnose a misbehaving process (`top`, `/proc`, `strace`) | 23–25     | USE lab; stuck-process diagnosis                |
| Event loop, threads, M:N; GC designs                      | 26, 27    | model-comparison and tricolor labs              |
| How the Node.js event loop works; blocking it             | 28–30     | ordering lab run against real Node              |
| JVM JIT, GC, virtual threads, thread dumps                | 31–34     | GC-log and thread-dump labs                     |
| Goroutines, Go GC, channels and data races                | 35–37     | G-M-P lab; GOGC lab; race lab                   |
| Choosing a runtime and sizing pools for a service         | 38        | capstone lab                                    |

## Running threads (C6)

- **`serve`**: a small C program that opens a file, reads it, writes a
  response to a pipe and exits cleanly on `SIGTERM`. It is traced in lesson 1,
  forked in 2, mapped in 8, given descriptors in 15, `fsync`ed in 18,
  containerized in 19–21, signalled in 22 and diagnosed in 23–25.
- **`work`**: the same tiny service written in Node.js, Java and Go. Each
  request does a little CPU work and one blocking call. It runs under each
  runtime chapter and is compared in lesson 38.

## Toolchain and evidence plan (E3–E6)

| Kind                           | Tool (recorded version)                               | How it runs                                                                                        |
| ------------------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Tested models and attempt labs | TypeScript, Vitest                                    | `pnpm verify`                                                                                      |
| Real event-loop ordering       | Node.js 24 (the repo's runtime)                       | In the gate; ordering is deterministic and asserted, timings recorded only                         |
| Syscall-level programs         | GCC 15.2 (existing `ANVAYA_CC`)                       | Subject native lab; outputs drift-checked                                                          |
| Syscall traces                 | `strace` 6.19 extracted from Ubuntu packages          | Recorded `strace -c` and `-f` summaries; drift-checked where deterministic                         |
| JVM evidence                   | OpenJDK 21 extracted (`ANVAYA_JAVA_HOME`)             | `javap` listings (deterministic, drift-checked); GC logs and thread dumps recorded                 |
| Go evidence                    | Go 1.26 extracted (`ANVAYA_GO`)                       | `-gcflags=-m` escape output (deterministic); `GODEBUG=gctrace=1` and race-detector output recorded |
| Containers                     | Docker (daemon present here)                          | Recorded `docker run` with `--memory`/`--cpus`; unprivileged containers only                       |
| CPU profiles and flame graphs  | Runtime profilers: Node `--cpu-prof`, JFR, Go `pprof` | Recorded; `perf` has no package for the WSL2 kernel, so it is not used                             |

Every recording stores date, tool versions, kernel (`uname -r`), CPU and the
command. Timings carry no thresholds; tests assert only what the prose claims
(E4). WSL2 differences are stated next to each result (E5).

## Chapters and lessons

38 pages in 10 chapters, 20–30 minutes each (965 minutes, about 16 hours of
reading and attempting). Chapters follow prerequisites (C3). Within a chapter, lessons are
in drafting order. "Sources" are pages opened on 2026-11-17 for this proposal;
☐ marks a source to register in the planning change.

### Chapter 1: The kernel boundary and processes

#### 1. System calls: The kernel's front door (`system-calls`, ~25 min, foundation)

- **Unit:** what happens from a library call to the kernel and back: the
  system-call number, dispatch, and the vDSO shortcut.
- **Prerequisites:** architecture `hardware-software-interaction`.
- **Objectives:** trace a file read from the C library to kernel dispatch and
  back; explain why `clock_gettime` can avoid a kernel entry; count the system
  calls a small program makes.
- **Hook and analogy:** two calls that look alike, `getpid` and
  `clock_gettime`, differ in cost. A bank teller's window is the analogy; it
  stops at the vDSO, a window that hands out some answers without a teller.
- **Figures:** a call-path diagram (user code → libc → entry → dispatch table
  → handler → return) with the vDSO bypass, computed from a classification
  model. A bar chart of `strace -c` counts for `serve`, from the recording.
- **Worked example:** `serve`'s system calls in order, from the recorded trace.
- **Lab:** `solve(trace)` summarizes a syscall trace: calls per name, errors,
  and bytes read and written. Hidden cases cover failed calls, interleaved
  threads and malformed lines. Cross-checked against the recorded `strace -c`
  totals.
- **Evidence:** `strace -c` and `strace -f` of `serve` (extracted `strace`).
- **Interview themes:** what a system call costs; system call vs function call;
  vDSO; why `strace` slows a program.
- **Problems:** none fits.
- **Sources:** man7 [syscalls(2)/vdso(7)](https://man7.org/linux/man-pages/man7/vdso.7.html);
  OSTEP's Limited Direct Execution chapter (from the
  [book index](https://pages.cs.wisc.edu/~remzi/OSTEP/)).

#### 2. Processes: fork, exec and wait (`processes`, ~25 min, foundation)

- **Unit:** the process lifecycle and its state machine; zombies and orphans.
- **Objectives:** predict a process tree and its outputs from `fork`/`exec`/`wait`
  code; explain zombies and why `wait` reaps them.
- **Hook and analogy:** a cell dividing, then one copy becoming a different
  cell. It stops at copying: the copy shares pages until a write (lesson 7).
- **Figures:** a process-tree stepper computed by a `fork` model; a lifecycle
  state diagram.
- **Lab:** `solve(program)` returns the tree, the exit statuses and any zombies
  for a small fork/exec/wait script. Hidden cases cover a double fork, an
  orphan and a failed exec. Cross-checked with a C program's recorded output.
- **Evidence:** C program printing PIDs and statuses (drift-checked structure,
  PIDs normalized).
- **Interview themes:** `fork` vs `exec`; zombie vs orphan; what a container's
  PID 1 must do.
- **Sources:** [OSTEP: Process API](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-api.pdf).

#### 3. Threads: What they share and what they don't (`threads`, ~20 min, foundation)

- **Unit:** the per-thread state (registers, stack, signal mask) and the
  shared state (address space, descriptors).
- **Objectives:** say what two threads share and what a forked child copies;
  read thread counts and IDs from `/proc`.
- **Figures:** a side-by-side address-space diagram (process vs threads),
  computed from the sharing model.
- **Lab:** `solve(resource, relation)` classifies a resource as shared, copied
  or private between threads, and between parent and child.
- **Evidence:** a C program comparing `/proc/self/status` across a thread and a
  child.
- **Sources:** [proc(5)](https://man7.org/linux/man-pages/man5/proc.5.html).

#### 4. Scheduling: Sharing a CPU fairly (`scheduling`, ~30 min, intermediate)

- **Unit:** run queues, time slices and virtual runtime; EEVDF's
  eligibility and deadlines in outline; `nice` weights.
- **Objectives:** compute run order and CPU shares for weighted tasks; explain
  why an I/O-bound task gets low latency.
- **Hook and analogy:** a shared kitchen with a fairness ledger. It stops at
  preemption: the kitchen cannot interrupt a cook mid-step.
- **Figures:** a timeline chart computed by a fair-scheduler model; a stepper
  through decisions.
- **Lab:** `solve(tasks, quantum)` returns each task's CPU share and order
  under a weighted fair model. Hidden cases cover equal weights, a `nice` gap
  and a task that sleeps. Cross-checked with a hand-computed table.
- **Interview themes:** preemptive vs cooperative scheduling; why CPU-bound
  work hurts tail latency.
- **Sources:** [sched(7)](https://man7.org/linux/man-pages/man7/sched.7.html);
  [kernel: EEVDF](https://docs.kernel.org/scheduler/sched-eevdf.html);
  [OSTEP: Scheduling](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf).

#### 5. Context switches: What switching costs (`context-switches`, ~20 min, intermediate)

- **Unit:** voluntary and involuntary switches, what is saved, and the
  indirect costs (cache and TLB).
- **Objectives:** distinguish voluntary from involuntary switches in
  `/proc/<pid>/status`; estimate the cost of switching from a measurement.
- **Figures:** a distribution chart of a recorded pipe ping-pong between two
  processes and two threads.
- **Lab:** `solve(samples)` estimates the per-switch cost and its spread from
  ping-pong runs (median, p90), reusing architecture's percentile convention.
- **Evidence:** C ping-pong measurement (recorded, alternated, no thresholds).
- **Interview themes:** what a context switch costs and why thread-per-request
  stops scaling.
- **Sources:** proc(5); OSTEP scheduling.

### Chapter 2: Memory

#### 6. Page tables: Translating an address (`page-tables`, ~25 min, intermediate)

- **Unit:** a multi-level page walk as the kernel builds it.
- **Prerequisites:** architecture `memory-hierarchy-and-caches` (TLB).
- **Objectives:** translate a virtual address through a four-level table;
  explain why page tables are sparse.
- **Figures:** a page-walk stepper with the address split into fields,
  computed from the model.
- **Lab:** `solve(tables, address)` returns the physical address or the fault
  kind. Hidden cases cover a missing level, permissions and huge pages.
- **Sources:** [OSTEP: Paging](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf);
  [kernel: memory concepts](https://docs.kernel.org/admin-guide/mm/concepts.html).

#### 7. Page faults, copy-on-write and overcommit (`page-faults`, ~25 min, intermediate)

- **Unit:** minor and major faults; copy-on-write after `fork`; overcommit and
  the OOM killer in outline.
- **Objectives:** count the faults a fork-then-write sequence takes; explain
  why `malloc` succeeds but the process is later killed.
- **Figures:** before/after copy-on-write page diagrams from the model.
- **Lab:** `solve(events)` returns minor and major fault counts and the pages
  shared after a sequence of forks, reads and writes.
- **Evidence:** a C program reading its own fault counters (`getrusage`).
- **Interview themes:** why `fork` is cheap; what overcommit means.
- **Sources:** [mmap(2)](https://man7.org/linux/man-pages/man2/mmap.2.html); kernel memory concepts.

#### 8. Resident memory and the page cache (`resident-memory`, ~25 min, intermediate)

- **Unit:** RSS vs PSS vs virtual size; the page cache and file-backed
  mappings; what "free" memory means.
- **Objectives:** compute RSS and PSS from mappings; read `/proc/meminfo` and
  explain cached memory.
- **Figures:** a stacked bar of a process's mappings from a recorded
  `/proc/<pid>/smaps_rollup`.
- **Lab:** `solve(mappings)` returns RSS and PSS for processes sharing pages.
- **Evidence:** `serve` mapping a file; recorded `smaps_rollup` and `vmstat`.
- **Interview themes:** why RSS overstates memory; what the page cache does.
- **Sources:** proc(5); kernel memory concepts.

#### 9. Allocators: Why freed memory stays (`allocators`, ~25 min, intermediate)

- **Unit:** size classes, free lists, arenas and fragmentation; returning
  memory to the OS.
- **Prerequisites:** architecture `stack-and-heap`.
- **Objectives:** trace allocations through a size-class allocator; explain
  why RSS stays high after frees.
- **Figures:** a heap-layout stepper from the toy allocator.
- **Lab:** `solve(ops)` implements a toy size-class allocator's addresses and
  fragmentation. Hidden cases cover reuse, coalescing and exhaustion.
- **Sources:** OSTEP free-space management (chapter on the same index page).

### Chapter 3: Concurrency and synchronization

#### 10. Race conditions and critical sections (`race-conditions`, ~25 min, foundation)

- **Unit:** interleavings, atomicity and the lost update at the language level.
- **Prerequisites:** architecture `multicore-coherence-and-atomics`.
- **Objectives:** enumerate the interleavings of two short threads; find the
  critical section.
- **Figures:** an interleaving explorer computed by enumerating schedules.
- **Lab:** `solve(threadA, threadB)` returns every possible final value. Hidden
  cases cover read-modify-write, a check-then-act and a correctly locked
  version.
- **Evidence:** a C lost-update counter (recorded counts, no thresholds).
- **Sources:** [OSTEP: Locks](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-locks.pdf).

#### 11. Mutexes, futexes and contention (`mutexes`, ~30 min, intermediate)

- **Unit:** how a lock spins, then sleeps in the kernel with a futex; what
  contention costs.
- **Objectives:** trace a mutex's fast and slow paths; explain contention from
  a measurement.
- **Figures:** a lock state machine (unlocked, locked, contended) from the
  model; a recorded contention chart.
- **Lab:** `solve(events)` returns the lock state and the number of futex
  waits and wakes.
- **Evidence:** a C contention measurement at 1–8 threads; `strace -c` futex
  counts.
- **Sources:** [futex(2)](https://man7.org/linux/man-pages/man2/futex.2.html); OSTEP locks.

#### 12. Condition variables and bounded queues (`condition-variables`, ~25 min, intermediate)

- **Unit:** waiting for a condition; spurious wakeups; producer–consumer.
- **Objectives:** write a correct wait loop; implement a bounded blocking
  queue.
- **Figures:** a producer–consumer stepper showing the queue and the waiting
  threads.
- **Lab:** `solve(ops, capacity)` returns the order of completions and the
  blocked threads for a bounded queue.
- **Problems:** Print FooBar Alternately and Print Zero Even Odd (LeetCode
  concurrency). Title, difficulty, paid-only status and list memberships to be
  checked when drafting.
- **Sources:** [OSTEP: Condition Variables](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-cv.pdf).

#### 13. Semaphores and reader–writer locks (`semaphores`, ~20 min, intermediate)

- **Unit:** counting permits; readers and writers; writer starvation.
- **Lab:** `solve(ops, permits)` returns who proceeds and who waits.
- **Problems:** Building H2O (to check).
- **Sources:** OSTEP semaphores (chapter on the same index page).

#### 14. Deadlock and lock ordering (`deadlock`, ~25 min, intermediate)

- **Unit:** the four conditions, wait-for graphs and lock ordering.
- **Objectives:** find a cycle in a wait-for graph; fix it with an order.
- **Figures:** a wait-for graph computed from a scenario.
- **Lab:** `solve(holds, waits)` returns a deadlock cycle or none.
- **Evidence:** a recorded JVM thread dump showing "Found one Java-level
  deadlock" (OpenJDK).
- **Problems:** The Dining Philosophers (to check).
- **Sources:** [OSTEP: Concurrency Bugs](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf);
  [jcmd](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html).

### Chapter 4: Files and I/O for services

#### 15. File descriptors and the open-file table (`file-descriptors`, ~20 min, foundation)

- **Unit:** descriptors, open-file descriptions, `dup` and `fork` sharing;
  leaks and limits.
- **Lab:** `solve(ops)` returns each process's descriptor table and shared
  offsets after opens, dups and forks.
- **Evidence:** `serve`'s `/proc/<pid>/fd` and `ulimit -n` behaviour.
- **Sources:** proc(5).

#### 16. Blocking, non-blocking and readiness with epoll (`epoll`, ~30 min, intermediate)

- **Unit:** why blocking threads do not scale, non-blocking descriptors, and
  level- vs edge-triggered readiness.
- **Objectives:** trace a readiness loop; explain an edge-triggered starvation
  bug.
- **Figures:** a readiness-loop stepper from the model.
- **Lab:** `solve(events, mode)` returns which handlers run, for level and
  edge triggering.
- **Sources:** [epoll(7)](https://man7.org/linux/man-pages/man7/epoll.7.html).

#### 17. Completion-based I/O with io_uring (`io-uring`, ~20 min, advanced)

- **Unit:** submission and completion rings, and how they differ from
  readiness.
- **Lab:** `solve(submissions)` returns completion order and ring occupancy.
- **Evidence:** WSL2 availability of `io_uring` to be checked; if
  unavailable, model-only and labelled.
- **Sources:** [io_uring_setup(2)](https://man7.org/linux/man-pages/man2/io_uring_setup.2.html).

#### 18. Durability: What fsync promises (`fsync`, ~25 min, intermediate)

- **Unit:** dirty pages, writeback, `fsync` and `fdatasync`, rename for
  atomic replacement.
- **Objectives:** classify which writes survive a crash at each point.
- **Lab:** `solve(ops, crashPoint)` returns the surviving file contents.
- **Sources:** OSTEP crash consistency (index page); man7 fsync(2) (to open
  when drafting).

### Chapter 5: Containers and process control

#### 19. Namespaces: What a container sees (`namespaces`, ~25 min, intermediate)

- **Unit:** PID, mount, network and user namespaces; a container as a
  process.
- **Evidence:** recorded `docker run` showing PID 1 and `/proc` inside.
- **Lab:** `solve(namespaces, query)` returns what a process sees.
- **Sources:** [namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html).

#### 20. cgroups: CPU quotas and throttling (`cgroups-cpu`, ~25 min, intermediate)

- **Unit:** `cpu.max` quota and period, and throttling latency.
- **Lab:** `solve(quota, period, demand)` returns throttled time per period.
- **Evidence:** recorded `cpu.stat` from a Docker run with `--cpus`.
- **Sources:** [cgroup v2](https://docs.kernel.org/admin-guide/cgroup-v2.html);
  [cgroups(7)](https://man7.org/linux/man-pages/man7/cgroups.7.html).

#### 21. Memory limits and OOM kills (`memory-limits`, ~25 min, intermediate)

- **Unit:** `memory.max`, reclaim, and the OOM killer inside a container.
- **Lab:** `solve(limit, usage)` classifies outcomes (reclaim, throttle, kill).
- **Evidence:** recorded OOM kill with exit code 137 and `memory.events`.
- **Sources:** cgroup v2.

#### 22. Signals, pipes and graceful shutdown (`signals`, ~25 min, intermediate)

- **Unit:** signal delivery and dispositions; pipes; `SIGTERM` handling in a
  container's PID 1.
- **Lab:** `solve(dispositions, signals)` returns what the process does.
- **Evidence:** `serve` shutting down cleanly under `docker stop`.
- **Sources:** [signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html);
  [pipe(7)](https://man7.org/linux/man-pages/man7/pipe.7.html).

### Chapter 6: Linux diagnostics

#### 23. The USE method on one host (`use-method`, ~20 min, foundation)

- **Unit:** utilization, saturation and errors per resource.
- **Lab:** `solve(metrics)` classifies readings and names the bottleneck.
- **Sources:** [Brendan Gregg: The USE Method](https://www.brendangregg.com/usemethod.html) ☐.

#### 24. Diagnosing a stuck process (`stuck-processes`, ~25 min, intermediate)

- **Unit:** process states (R, S, D, Z), `wchan`, and `strace -p`.
- **Lab:** `solve(evidence)` diagnoses blocked I/O, lock wait, CPU spin or
  zombie.
- **Evidence:** recorded traces of `serve` in each state.
- **Sources:** proc(5).

#### 25. CPU profiles and flame graphs (`flame-graphs`, ~25 min, intermediate)

- **Unit:** sampling profilers, on-CPU vs off-CPU time, reading a flame graph.
- **Lab:** `solve(stacks)` folds sampled stacks into flame-graph widths.
- **Evidence:** a recorded Node `--cpu-prof` profile of `work` (no `perf`).
- **Sources:** [Brendan Gregg: Flame Graphs](https://www.brendangregg.com/flamegraphs.html) ☐.

### Chapter 7: Runtime models

#### 26. Concurrency models: Event loop, threads, M:N (`concurrency-models`, ~30 min, intermediate)

- **Unit:** where a blocking call waits under each model, and what it costs.
- **Objectives:** predict latency and throughput for CPU-bound and I/O-bound
  loads under each model; size a thread pool.
- **Figures:** a computed latency chart for the three models under the same
  load.
- **Lab:** `solve(model, workload)` returns completion times for requests.
- **Interview themes:** event loop vs thread-per-request vs goroutines; pool
  sizing.

#### 27. Garbage collection designs (`gc-designs`, ~30 min, intermediate)

- **Unit:** tracing, generational, concurrent marking, write barriers and
  pause time.
- **Prerequisites:** architecture `stack-and-heap`.
- **Figures:** a tricolor-marking stepper from the model.
- **Lab:** `solve(heap, roots, mutations)` returns the surviving objects,
  including a write during marking.

### Chapter 8: Node.js and V8

#### 28. The libuv event loop and its thread pool (`event-loop`, ~25 min, intermediate)

- **Unit:** phases (timers, poll, check, close) and the worker pool.
- **Evidence:** real Node runs in the gate; ordering asserted.
- **Sources:** [Node.js event loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick) ☐;
  [libuv design](https://docs.libuv.org/en/v1.x/design.html) ☐.

#### 29. Microtasks, promises and nextTick (`microtasks`, ~25 min, intermediate)

- **Unit:** the order of `process.nextTick`, promise jobs and macrotasks.
- **Lab:** `solve(program)` predicts the log order; hidden cases are checked
  against real Node in the gate (independent cross-check).
- **Sources:** Node.js event loop guide ☐; `ecma262` (jobs).

#### 30. Blocking the loop and V8's garbage collector (`blocking-the-loop`, ~25 min, intermediate)

- **Unit:** event-loop delay, offloading to workers, and Orinoco's pauses.
- **Evidence:** recorded `monitorEventLoopDelay` histogram and `--trace-gc`.
- **Sources:** [Don't block the event loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop) ☐;
  [V8: Trash talk](https://v8.dev/blog/trash-talk) ☐.

### Chapter 9: The JVM

#### 31. Bytecode, interpretation and JIT tiers (`jvm-execution`, ~25 min, intermediate)

- **Evidence:** `javap -c` listings (deterministic, drift-checked); JIT
  compilation log.
- **Sources:** [JVM specification SE 21](https://docs.oracle.com/javase/specs/jvms/se21/html/) ☐.

#### 32. Heap generations and the G1 collector (`jvm-g1`, ~30 min, intermediate)

- **Evidence:** recorded `-Xlog:gc` under the `work` service.
- **Lab:** `solve(gcLog)` summarizes pauses (count, median, p99) and
  promotion.
- **Sources:** [HotSpot GC tuning guide 21](https://docs.oracle.com/en/java/javase/21/gctuning/) ☐.

#### 33. Low-latency collection with ZGC (`jvm-zgc`, ~25 min, advanced)

- **Evidence:** the same workload under generational ZGC; recorded pauses.
- **Sources:** [JEP 439](https://openjdk.org/jeps/439) ☐; GC tuning guide ☐.

#### 34. Platform threads, virtual threads and thread dumps (`jvm-threads`, ~30 min, intermediate)

- **Unit:** mounting virtual threads on carriers, pinning, and reading dumps.
- **Lab:** `solve(tasks, carriers)` returns completion order and pinned waits.
- **Evidence:** recorded `jcmd Thread.dump_to_file` output.
- **Sources:** [JEP 444](https://openjdk.org/jeps/444) ☐; jcmd ☐.

### Chapter 10: Go and choosing a runtime

#### 35. Goroutines and the G-M-P scheduler (`go-scheduler`, ~30 min, intermediate)

- **Unit:** G, M and P; run queues; work stealing; blocking syscalls handing
  off a P.
- **Figures:** a G-M-P stepper from the model.
- **Lab:** `solve(goroutines, procs)` returns run order with stealing.
- **Sources:** [runtime/proc.go design comment](https://go.dev/src/runtime/proc.go) ☐;
  [runtime package](https://pkg.go.dev/runtime) ☐.

#### 36. Go's garbage collector, GOGC and GOMEMLIMIT (`go-gc`, ~25 min, intermediate)

- **Lab:** `solve(liveHeap, gogc, limit)` returns the heap target.
- **Evidence:** recorded `GODEBUG=gctrace=1`; `-gcflags=-m` escape analysis
  (deterministic, drift-checked).
- **Sources:** [Go GC guide](https://go.dev/doc/gc-guide) ☐.

#### 37. Channels, the memory model and data races (`go-concurrency`, ~25 min, intermediate)

- **Lab:** `solve(program)` decides whether a happens-before edge orders two
  accesses.
- **Evidence:** recorded `go run -race` report.
- **Sources:** [Go memory model](https://go.dev/ref/mem) ☐.

#### 38. Choosing a runtime and sizing pools (`choosing-a-runtime`, ~30 min, advanced)

- **Unit:** the capstone: comparing `work` under Node, the JVM and Go, plus a
  paragraph on Python's GIL and free threading.
- **Lab:** `solve(workload, runtime)` recommends a pool size and model, with
  stated assumptions.
- **Sources:** [Python free threading](https://docs.python.org/3/howto/free-threading-python.html)
  (for the paragraph only).

Detailed bullets for lessons 13, 15 and 17–38 follow the same template when
each is drafted. The figure, lab contract and evidence listed here are the
commitments.

## Duplication check (C5)

| Concept                              | Single home                        | Others link to it  |
| ------------------------------------ | ---------------------------------- | ------------------ |
| Privilege entry and the trap         | architecture hardware-software     | lesson 1           |
| TLB vs page fault                    | architecture memory hierarchy      | lessons 6, 7       |
| Atomic RMW, coherence, false sharing | architecture multicore             | lessons 10, 11     |
| Tracing GC basics                    | architecture stack-and-heap        | lesson 27          |
| Percentiles of repeated timings      | architecture measuring-performance | lessons 5, 32      |
| Socket semantics                     | networking                         | lesson 16          |
| Event-loop phase order               | lesson 28                          | lessons 26, 29, 38 |

## Totals and drafting order

10 chapters, 38 pages (the count above), about 16 hours of reading and
attempting. At 6–10 hours a week, including the owner's study, that is roughly
4–6 weeks. Drafting follows the numbering; the owner reviews after each lesson,
and an audit of each chapter runs before the next chapter starts.

## Decisions for the owner

1. **Size.** Accept 38 pages, or trim: merge 13 into 12, 17 into 16, and 33 into
   32 for 35 pages. _Recommendation: accept; the runtime chapters are what you
   asked for._
2. **Native runner.** Copy architecture's `verify-native.mjs` pattern into this
   subject, or first extract a shared runner both subjects use. _Recommendation:
   extract a shared runner, as one platform change before lesson 1, since this
   subject adds Java, Go, `strace` and Docker artifacts._
3. **Go version.** Ubuntu offers Go 1.26 and 1.24. _Recommendation: 1.26._
4. **Root use.** You allowed root here. _Recommendation: still extract tools
   without root and use unprivileged containers, so every recording can be
   reproduced the same way; use root only if a specific lesson needs it._
5. **Boundaries.** Approve the ownership table above, especially socket
   semantics (networking) and cross-service observability (SPR).

## Risks and unverified claims (E7, E9)

- WSL2's kernel (6.18, Microsoft build) may differ from a distribution kernel.
  Not yet checked: `io_uring` availability, the cgroup v2 controllers Docker
  exposes, and whether Docker's containers run on the same kernel.
- `perf` has no package for this kernel, so CPU profiles come from runtime
  profilers; off-CPU analysis is limited and stated as such.
- The EEVDF page will describe the scheduler only at the level of the kernel
  documentation; finer details need the source.
- LeetCode concurrency problems are candidates only. Paid-only status and list
  memberships were not checked.
- Sources marked ☐ were opened (HTTP 200, title read) but not yet read in
  depth for each claim; that happens when each lesson is drafted.
