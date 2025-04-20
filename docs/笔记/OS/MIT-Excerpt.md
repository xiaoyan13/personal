# An excerpt from the 6.1810 lecture handouts

## [Overview](https://pdos.csail.mit.edu/6.828/2023/lec/l-overview.txt)

* What's an operating system?
  - h/w: CPU, RAM, disk, net, &c
  - kernel services: FS, processes, memory, network, &c
  - user applications: sh, cc, DB, &c
  - system calls

* What is the basic purpose of an O/S?
  - **Abstract** the hardware for portability; **Multiplex** the hardware among many applications
  - **Isolate** applications for security and to contain bugs
  - Allow **sharing** among cooperating applications

* Design tensions make O/S design interesting
  - efficient vs abstract/portable/general-purpose
  - powerful vs simple interfaces
  - flexible vs secure
  - compatible vs new hardware and interfaces

## [OS design](https://pdos.csail.mit.edu/6.828/2023/lec/l-os.txt)

* What do OS designers assume about security?
  - We assume user code is actively malicious
    1. Actively trying to break out of isolation
    2. Actively trying to trick system calls into doing something stupid
    3. Actively trying to interfere with other programs...
  - We assume kernel code is trustworthy
    1. We assume kernel developers are well-meaning and competent
    2. We're not too worried about kernel code abusing other kernel code.
    3. Of course, there are nevertheless bugs in kernels

* How can a kernel defend itself against user code?
  - two big components:
    1. hardware-level controls on user instructions
    2. careful system call interface and implementation

* hardware-level isolation
  - CPUs and kernels are co-designed
    1. user/supervisor mode
    2. virtual memory

## [Page tables](https://pdos.csail.mit.edu/6.828/2023/lec/l-vm.txt)

* what does the physical address layout look like?
  - qemu simulates the board and thus the physical address layout: https://github.com/qemu/qemu/blob/master/hw/riscv/virt.c

* we want **isolated address spaces**
  - each process has its own memory
  - it can read and write its own memory
  - it cannot read or write anything else
  - we use **hardware-support** page table to achieve this goal

* simplified view
  - hardware:
    1. MMU uses index bits of VA to find a page table entry (PTE)
    2. MMU constructs physical address using PPN from PTE + offset of VA
  - software:
    1. each process has its own address space
    2. kernel makes a separate page table per process
    3. kernel switches page tables (i.e. sets **satp** register) when switching processes
    4. different processes have similar virtual address layouts ([specification](https://github.com/mit-pdos/xv6-riscv/blob/riscv/kernel/memlayout.h#L1))


* implement details: why 9 bits?
  - RISC-V 64 uses a "three-level page table" to save space. High 9 bits of va index into level-one page directory; 2nd 9 bits indexes level-two directory, same for 3rd 9 bits
  - 9 bits determines the size of a page directory
  - 9 bits -> 512 PTEs -> 4096 bytes, or one page
  - that is, 9 bits means a directory **fits on** a single page

* TLB efficiency trade-off
  - CPUs caches paging translation for speed
  - xv6 flushes entire TLB during user/kernel transitions

## Traps

key ideas:

1. Every register should be used and restored legally, and follows the specification's workflow mentioned.
2. Considering all possible situations would be performed, like traps: time scheduling & process change, devide interrupt, etc, during the running of current code.

### [Page faults](https://pdos.csail.mit.edu/6.828/2023/lec/l-pgfaults.txt)

* many things you can do with vm: 
  1. lazy allocation
  2. zero filled on demand(typically BSS segment)
  3. copy-on-write(COW) fork
  4. demand paging + **evict pages**(a general method for phycical memory use up)
  5. file mapped memory

* Information we might need at a page fault
  1. The virtual address that caused the fault. See stval register; page faults set it to the fault address
  2. The type of violation that caused the fault. See scause register value (instruction, load, and Store page fault)
  3. The instruction and mode where the fault occurred
    - User IP: tf->epc
    - U/K mode: implicit in usertrap/kerneltrap
  4. some flags are setted in PTE to distinguish which page fault happened.

### [Device drivers](https://pdos.csail.mit.edu/6.828/2023/lec/l-interrupt.txt)

Devices and CPU run in parallel, when device needs driver attention, device raises an interrupt.CPU must set aside current work and respond,on RISC-V use same trap mechanism as for syscalls and exceptions.

* Interrupt evolution
  - Interrupts used to be cheap in CPU cycles; now they take many cycles
    - due to pipelines, large register sets, cache misses
    - interrupt overhead is around a microsecond -- excluding actual device driver code!
  - So:
    - old approach: simple h/w, smart s/w, lots of interrupts
    - new approach: smart h/w, does lots of work for each interrupt, like **Polling**.

- DMA (direct memory access) can move data efficiently
  - the xv6 uart driver read bytes one at a time in software.CPUs are not very efficient for this: off chip, not cacheable, 8 bits at a time. But OK for low-speed devices
  - most devices automatically copy input to RAM -- DMA, then interrupt. Input is already in ordinary memory. CPU memory operations usually much more efficient
  - Special fast paths like DMA is a continuing area of concern

* timer

Timer interrupt is a specical interrupt which need to be dealed timely all the time. Its conflicts with other common interrupt(i.e. interrupt in interrupt is forbidden in xv6, but is allowed in mordern OS. It will cause problems. In xv6, this feature is banned, and other features derived from it are implemented through other approachs.), which needed to be considered carefully.

## [File System](https://pdos.csail.mit.edu/6.828/2023/lec/l-fs.txt)

* goals
  - crash recovery
  - performance(concurrency, I/O copy optimism, etc.)
  - sharing/permission control

* FS software layers:
  - system calls
  - name ops | FD ops
  - inodes
  - inode cache
  - log
  - buffer cache
  - virtio_disk driver
  - SSD/HDD

* on-disk layout in xv6 computer

xv6 treats disk as an array of sectors.

  0: unused,
  1: super block (size, ninodes),

  2: log for transactions,

  32: array of inodes, packed into blocks,

  45: block in-use bitmap (0=free, 1=used),

  46: file/dir content blocks,

  end of disk.

* crash recovery solution: write-ahead logging

- Every operation modifing file system contents in hardware is called a "write".
- If a write is happening when the computer crushs, the file system state will not be normal.
- We use logs to record all write to the file system, which are saved in a particular metadata area of the hardware, not belonging to tree of the user content in the file system. We put a sign in the metadata after each writing to the logging area successfully.
  - Considering writing a log when the computer crushs. It doesn't effect the file system tree. It only effect the log area. Since we used a sign to identify which log is valid, the crush can be found easily.
  - Considering a transition.A transition means the OS use the logs record to modify the user content tree in the file system. If a transition done successfully, thing is OK, and the logs will signed as "done".
  - If the computer curshed during a transition, things will be bad. In this scene, the tree is abnormal, it cannot be reused after rebooting. But the log erea is good, we not modify it.So we still the ample info about what the user need do to the file system so far.
- After rebooting, OS running recovery code. It look all logs and commit them. Logs had been commited are ignored; those not successfully been commited before the PC shutdown will be re-commited. After doing this, file system becomes from abnormal to normal.
- A edge case which confusing us is that, when all logs in a transition has done, and then the computer crushs. In this case, Although the logs are committed, We don't know this, cause the logs not be signed as "done". After rebooting, the OS will see that, oh, these logs not be commited, I need do them -- actually, they has aleady done, so we write twice to the content tree according the logs in the end. This not have any problems, because writing to a disignated erea in the file system any times is the same effect.

* Future trending
  - file system/disk management detech: different kinds of disks with different layouts provide the same interface/specification to software; fs calls doesn't depending on the layout of disk hardeare.