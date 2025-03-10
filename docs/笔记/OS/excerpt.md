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

What do OS designers assume about security?
  We assume user code is actively malicious
    Actively trying to break out of isolation
    Actively trying to trick system calls into doing something stupid
    Actively trying to interfere with other programs...
  We assume kernel code is trustworthy
    We assume kernel developers are well-meaning and competent
    We're not too worried about kernel code abusing other kernel code.
    Of course, there are nevertheless bugs in kernels

How can a kernel defend itself against user code?
  two big components:
    hardware-level controls on user instructions
    careful system call interface and implementation

hardware-level isolation
  CPUs and kernels are co-designed
  - user/supervisor mode
  - virtual memory
  
## [Page tables](https://pdos.csail.mit.edu/6.828/2023/lec/l-vm.txt)