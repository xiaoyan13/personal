# Excerpt from the 6.1810 lecture handouts

## [Overview](https://pdos.csail.mit.edu/6.828/2023/lec/l-overview.txt)

* What's an operating system?
  [user/kernel diagram]
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
    - Actively trying to break out of isolation
    - Actively trying to trick system calls into doing something stupid
    - Actively trying to interfere with other programs...
  We assume kernel code is trustworthy
    We assume kernel developers are well-meaning and competent
    We're not too worried about kernel code abusing other kernel code.
    Of course, there are nevertheless bugs in kernels

* How can a kernel defend itself against user code?
  - two big components:
    - hardware-level controls on user instructions
    - careful system call interface and implementation

hardware-level isolation
  CPUs and kernels are co-designed
  - user/supervisor mode
  - virtual memory

## [Page tables](https://pdos.csail.mit.edu/6.828/2023/lec/l-vm.txt)

* what does the physical address layout look like?
  qemu simulates the board and thus the physical address layout
  https://github.com/qemu/qemu/blob/master/hw/riscv/virt.c

* we want **isolated address spaces**
  - each process has its own memory
  - it can read and write its own memory
  - it cannot read or write anything else
  - we use **hardware-support** page table to achieve this goal

* simplified view
  - hardware:
    - MMU uses index bits of VA to find a page table entry (PTE)
    - MMU constructs physical address using PPN from PTE + offset of VA
  - software:
    - each process has its own address space
    - kernel makes a separate page table per process
    - kernel switches page tables (i.e. sets **satp** register) when switching processes
    - different processes have similar virtual address layouts ([specification](https://github.com/mit-pdos/xv6-riscv/blob/riscv/kernel/memlayout.h#L1))


* implement details: why 9 bits?
  - RISC-V 64 uses a "three-level page table" to save space. High 9 bits of va index into level-one page directory; 2nd 9 bits indexes level-two directory, same for 3rd 9 bits
  - 9 bits determines the size of a page directory
  - 9 bits -> 512 PTEs -> 4096 bytes, or one page
  - that is, 9 bits means a directory **fits on** a single page
