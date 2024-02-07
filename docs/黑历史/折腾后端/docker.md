# docker概要

本文是初次较为深入的学习`docker`时所写的笔记。仅可作为参考资料，而非教程。

## 1 docker技术概要

- Go语言开发

- 基于 `Linux` 内核的 cgroup， namespace以及Unoin FS等技术，对进程进行封装隔离

- 与虚拟机的不同：直接跑在宿主系统之上，而不是新建一个子系统（但基本实现了一个小型系统的各种功能），所以更轻量；而且打包后的镜像可移植。

- **分层存储**（Unoin FS）

  严格来说，docker镜像并非是像一个 `ISO` 那样的打包文件，镜像只是一个虚拟的概念，其实际体现由多层文件系统联合组成。

  镜像使用的是分层存储，容器也是如此。每一个容器运行时，是以镜像为基础层，在其上创建一个当前容器的存储层，我们可以称这个为容器运行时读写而准备的存储层为 **容器存储层**。
  
  参考图片<https://vuepress.mirror.docker-practice.com/introduction/what/#&gid=1&pid=1>

## 2 基本概念：Image、Container、Registry

### Image

一个操作系统分为 **内核** 和 **用户空间**。对于 `Linux` 而言，内核启动后，会挂载 `root` 文件系统为其提供用户空间支持。而 **Docker 镜像**（`Image`），就相当于是一个 `root` 文件系统。

**镜像** 是一个特殊的文件系统，除了提供容器运行时所需的程序、库、资源、配置等文件外，还包含了一些为运行时准备的一些配置参数（如匿名卷、环境变量、用户等）。镜像 **不包含** 任何动态数据，其内容在构建之后也不会被改变。

### Container

容器的实质是进程，但与直接在宿主执行的进程不同，容器进程运行于属于自己的独立的命名空间。容器内的进程是运行在一个隔离的环境里，使用起来，就好像是在一个独立于宿主的系统下操作一样。这种特性使得容器封装的应用比直接在宿主运行更加安全。也因为这种隔离的特性，它看起来很像一个虚拟机。（但并不是。）

### Registry

Docker Registry是一个集中的存储、分发镜像的地方。

一个 **Docker Registry** 中可以包含多个 **仓库**（`Repository`）；每个仓库可以包含多个 **标签**（`Tag`）；每个标签对应一个镜像。

通常，一个仓库会包含同一个软件不同版本的镜像，而标签就常用于对应该软件的各个版本。我们可以通过 `<仓库名>:<标签>` 的格式来指定具体是这个软件哪个版本的镜像。如果不给出标签，将以 `latest` 作为默认标签。

## 3 镜像（简略）

### 3.1 相关概念和常见操作

```bash
远程获取镜像：
$ docker pull [选项] [Docker Registry 地址[:端口号]/]仓库名[:标签]
```

- Docker 镜像仓库地址：地址的格式一般是 `<域名/IP>[:端口号]`。默认地址是 Docker Hub(`docker.io`)。
- 仓库名：如之前所说，这里的仓库名是两段式名称，即 `<用户名>/<软件名>`。对于 Docker Hub，如果不给出用户名，则默认为 `library`，也就是官方镜像。

**镜像 ID** 是镜像的唯一标识，一个镜像可以对应多个 **标签**。

**镜像总体积**并不等于各个镜像占用的总和，因为是分层存储，共享文件，所以实际体积会比总和小得多。

**虚悬镜像**是既没有仓库名，也没有标签，均为 `<none>`：

```bash
查看所有的镜像
$ docker image ls
查看虚悬镜像
$ docker image ls -f dangling=true
```

一般来说，虚悬镜像已经失去了存在的价值，他们是随着版本迭代而被更新掉的老版本。是可以随意删除的。一般来说其实删除并不会节约太多的空间，原因还是因为所有的镜像分层存储，共享文件，删除只会删掉属于自己不共享的那一小部分。

**中间层镜像** ：为了加速镜像构建、重复利用资源，Docker 会利用 **中间层镜像**。所以在使用一段时间后，可能会看到一些依赖的中间层镜像。默认的 `docker image ls` 列表中只会显示顶层镜像，如果希望显示包括中间层镜像在内的所有镜像的话，需要加 `-a` 参数。

```bash
删除镜像
$ docker image rm [选项] <镜像1> [<镜像2> ...]
```

其中，`<镜像>` 可以是 `镜像短 ID`、`镜像长 ID`、`镜像名` 或者 `镜像摘要`。

删除行为分为两类，一类是 `Untagged`，另一类是 `Deleted`。当我们使用上面命令删除镜像的时候，实际上是在要求删除某个标签的镜像。所以首先需要做的是将满足我们要求的所有镜像标签都取消，这就是我们看到的 `Untagged` 的信息。因为一个镜像可以对应多个标签，因此当我们删除了所指定的标签后，可能还有别的标签指向了这个镜像，如果是这种情况，那么 `Delete` 行为就不会发生。

### 3.2 镜像实现的底层原理（了解即可）

每个镜像有很多层，Docker使用`Union FS`把这些不同的层结合到一个镜像中去。

通常 Union FS 有两个用途, 一方面可以实现不借助 LVM、RAID 将多个 disk 挂到同一个目录下；另一个更常用的就是将一个只读的分支和一个可写的分支联合在一起，Live CD 正是基于此方法可以允许在镜像不变的基础上允许用户在其上进行一些写操作。

### 3.3 镜像制作

#### docker commit

可以利用`docker commit`来实现镜像的反复生成。但是，不要使用 `docker commit` 定制镜像（如果你要将其发布之类的），定制镜像应该使用 `Dockerfile` 来完成。commit会记录所有的容器存储层。这将导致很多没有必要的操作记录被写入生成的镜像中。发布的镜像应当是尽可能简洁的、不带有任何非必要数据的。

> 首先，如果仔细观察之前的 `docker diff webserver` 的结果，你会发现除了真正想要修改的 `/usr/share/nginx/html/index.html` 文件外，由于命令的执行，还有很多文件被改动或添加了。这还仅仅是最简单的操作，如果是安装软件包、编译构建，那会有大量的无关内容被添加进来，将会导致镜像极为臃肿。
>
> 此外，使用 `docker commit` 意味着所有对镜像的操作都是黑箱操作，生成的镜像也被称为 **黑箱镜像**，换句话说，就是除了制作镜像的人知道执行过什么命令、怎么生成的镜像，别人根本无从得知。而且，即使是这个制作镜像的人，过一段时间后也无法记清具体的操作。这种黑箱镜像的维护工作是非常痛苦的。
>
> 而且，回顾之前提及的镜像所使用的分层存储的概念，除当前层外，之前的每一层都是不会发生改变的，换句话说，任何修改的结果仅仅是在当前层进行标记、添加、修改，而不会改动上一层。如果使用 `docker commit` 制作镜像，以及后期修改的话，每一次修改都会让镜像更加臃肿一次，所删除的上一层的东西并不会丢失，会一直如影随形的跟着这个镜像，即使根本无法访问到。这会让镜像更加臃肿。

#### dockerfile

利用dockerfile定制镜像。Dockerfile 是一个脚本文件，其内包含了一条条的 **指令(Instruction)**，每一条指令构建一层，因此每一条指令的内容，就是描述该层应当如何构建。脚本文件里主要写入了镜像的构建步骤，比如基于现有的镜像构建，创建镜像时自动执行什么指令（如安装依赖），添加宿主机文件（项目）到镜像中，告诉docker镜像运行的时候将执行什么指令，以及杂项（如作者信息等）。

一个构建现有的flask项目的简单示例。dockerfile位于项目的最顶层文件夹，所以执行了`COPY  . .`将项目文件全部复制到镜像：

```yaml
# syntax=docker/dockerfile:1

FROM python:3.8-slim-buster

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

COPY . .

CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0"] #镜像生成容器运行时，将在WORKDIR指定的位置中执行CMD
```

具体的dockerfile Instructions，可以参考：

[使用 Dockerfile 定制镜像](https://vuepress.mirror.docker-practice.com/image/build/)

[构建python语言编写的项目镜像](https://docs.docker.com/language/python/build-images/)

#### docker build：深入docker的工作原理

dockerfile写完后，在 `Dockerfile` 文件所在目录执行：

```bash
$ docker build --tag python-docker .
# 格式：docker build [选项] <上下文路径/URL/->
```

即可构建镜像。

构建镜像的理解需要牵扯到docker工作原理。

> Docker 在运行时分为 Docker 引擎（也就是**服务端**守护进程）和本地客户端工具。Docker 的引擎提供了一组 REST API，被称为 Docker Remote API。而如 `docker` 命令这样的客户端工具，则是通过这组 API 与 Docker 引擎交互，从而完成各种功能。所以，我们执行docker指令时，实际上是在和远程的docker服务器交互，由它为我们提供服务。表面上我们好像是在本机执行各种 `docker` 功能，但实际上，一切都是使用的远程调用形式在服务端（Docker 引擎）完成。也因为这种 C/S 设计，让我们操作远程服务器的 Docker 引擎变得轻而易举。

既然是在外部构建镜像，自然无法获取本地的文件。因此`docker build`的`<上下文路径/URL/->`实际上就被认定为上传时的“根目录”。它有一个专业的名词定义，叫“上下文目录”。我们上传构建镜像时，会把这个目录也一并上传，以便构建镜像，所以`COPY` `ADD`等指令后面的路径，都是以该目录作为根路径的。这也就是这些指令后面的路径写诸如`COPY ../package.json /app`或者`COPY /opt/xxxx /app`无法工作的原因：`..`和绝对路径都无法被访问！这类指令中的源文件的路径都是*相对路径*。

在默认情况下，如果不额外指定 `Dockerfile` 的话，会将上下文目录下的名为 `Dockerfile` 的文件作为 Dockerfile。这只是默认行为，实际上 `Dockerfile` 的文件名并不要求必须为 `Dockerfile`，而且并不要求必须位于上下文目录中，比如可以用 `-f` 参数指定某个文件作为 `Dockerfile`。当然，一般大家习惯性的会使用默认的文件名 `Dockerfile`，以及会将其置于镜像构建上下文目录中。

## 4 容器

下面列出了一些操作，并探讨了底层相关内容，说明了容器到底是如何做到和一个操作系统相仿而又轻量的。

### 4.1 启动容器

启动容器的方式有两种。

```bash
用镜像启动一个容器
$ docker run -it <镜像> bash
```

其中，`-t` 选项让Docker分配一个伪终端（pseudo-tty）并绑定到容器的标准输入上， `-i` 则让容器的标准输入保持打开。

当利用 `docker run` 来创建容器时，Docker 在后台运行的标准操作包括：

- 检查本地是否存在指定的镜像，不存在就从 [registry](https://vuepress.mirror.docker-practice.com/repository/) 下载
- 利用镜像创建并启动一个容器
- 分配一个文件系统，并在只读的镜像层外面挂载一层可读写层
- 从宿主主机配置的网桥接口中桥接一个虚拟接口到容器中去
- 从地址池配置一个 ip 地址给容器
- 执行用户指定的应用程序
- 执行完毕后容器**被终止**，也就是说这个容器是一次性的

```bash
将一个暂停的容器重新启动
$ docker container start <容器>
```

容器的核心为所执行的应用程序，所需要的资源都是应用程序运行所必需的。除此之外，并没有其它的资源。可以在伪终端中利用 `ps` 或 `top` 来查看进程信息。

```bash
查看进程信息
root@ba267838cc1b:/# ps
  PID TTY          TIME CMD
    1 ?        00:00:00 bash
   11 ?        00:00:00 ps
```

可见，容器中仅运行了指定的 bash 应用。这种特点使得 Docker 对资源的利用率极高，是货真价实的轻量级虚拟化。

### 4.2 后台运行

更多的时候，需要让 Docker 在后台运行。此时，可以通过添加 `-d` 参数来实现设定运行模式为后台运行。加了 **-d** 参数默认不会进入容器，想要进入容器需要使用指令 **docker exec**。

使用 `-d` 参数启动后会返回一个唯一的 id，也可以通过 `docker container ls` 命令来查看容器信息。

```bash
通过镜像创建一个容器，并挂起到一个bash终端上进行后台运行。
$ docker run -itd <image> bash
查看现存的挂起容器
$ docker container ls
$ docker ps
```

要获取容器的输出信息，可以通过 `docker container logs` 命令。

```bash
docker container logs [container ID or NAMES]
```

### 4.3 进入容器

在使用 **-d** 参数时，容器启动后会进入后台。此时想要进入容器，可以通过以下指令进入：

- **docker attach**，此命令退出容器终端，会导致容器停止。
- **docker exec**：推荐使用 docker exec 命令，此命令退出容器终端，不会导致容器停止。

### 4.4 终止容器

可以使用 `docker container stop` 来终止一个运行中的容器。

终止状态的容器可以用 `docker container ls -a` 命令看到。

只启动了一个终端的容器，用户通过 `exit` 命令或 `Ctrl+d` 来退出终端时，所创建的容器立刻终止。

### 4.5 删除容器

可以使用 `docker container rm` 来删除一个处于终止状态的容器。

用下面的命令可以清理掉所有处于终止状态的容器：

```bash
docker container prune
```

### 4.6 容器底层原理

`cgroup`和`namespace`是实现容器的最重要的技术，`cgroup`实现了资源限额，而`namespace`实现资源隔离。

#### cgroup

`Control Group`，用于设置进程使用cpu，内存和IO资源的限额。我们可以在`sys/fs/cgroup`中找到它。

在`sys/fs/cgroup/cpu/docker`目录中，Linux会为，每一个容器创建一个`cgroup`目录，以容器的长ID命名。

同样的，`sys/fs/cgroup/memopry/docker`与`sys/fs/cgroup/blkio/docker`中保存的是内存/Block IO配置。

#### namespace

namespace（命名空间）实现了资源的隔离。Linux使用了6中命名空间：

- mount namespace：让容器看上去拥有整个文件系统
- UTS namespace：让容器用用自己的hostname，可以通过`-h`或者`-hostname`配置。默认为短ID。
- IPC namespace：让容器拥有自己的内存和信号量来为实现进程键通信，而不会与host和其他容器的IPC混在一起。
- PID namespace：区分各个容器内部的进程
- NetWork namespace：让容器拥有自己独立的网卡，IP，路由等联网资源
- User namespace：让容器能够管理自己的用户，Host无法看到容器内部创建的用户。

## 5 docker数据管理

### 5.1 数据管理的需求产生与解决

docker的分层存储原理中规定镜像不可变，容器可变。所以我们的数据是运行中的容器产生的。这类数据分为两类：需要持久化的数据和不需要持久化的数据。需要持久化的数据如数据库，日志，静态文件等。不需要持久化的数据即数据库软件，应用程序或者软件本身。他们的修改是对容器的直接修改，不需要去持久化，他们将在发布前生成镜像的时候，作为镜像的一部分（但不要用commit直接生成镜像，这会带有很多不必要的冗余记录，再次强调）。

对于需要持久化的数据，我们一般把它放在`data volume`（译作数据卷，感觉挺奇怪的···）中。它实际上是docker所在的host系统中的一个目录，只不过被用于存储docker运行过程中产生的数据。这个目录被挂载到运行中的docker容器中，用于存储需要持久化的数据。

- 数据卷的特点

  `数据卷` 是一个可供一个或多个容器使用的特殊目录，它绕过 UFS，可以提供很多有用的特性：

  - `数据卷` 可以在容器之间共享和重用
  - 对 `数据卷` 的修改会立马生效
  - 对 `数据卷` 的更新，不会影响镜像
  - `数据卷` 默认会一直存在，即使容器被删除

  > 注意：`数据卷` 的使用，类似于 Linux 下对目录或文件进行 mount，镜像中的被指定为挂载点的目录中的文件会复制到数据卷中（仅数据卷为空时会复制）。

### 5.2 数据卷

#### 数据卷相关操作

```bash
# 创建数据卷
$ docker volume create my-vol
# 查看现有数据卷
$ docker volume ls
# 在主机里使用以下命令可以查看指定 数据卷 的信息
$ docker volume inspect my-vol
[
    {
        "Driver": "local",
        "Labels": {},
        "Mountpoint": "/var/lib/docker/volumes/my-vol/_data",
        "Name": "my-vol",
        "Options": {},
        "Scope": "local"
        ...
    }
]
# 删除数据卷
$ docker volume rm my-vol
```

#### 数据卷的挂载

在用 `docker run` 命令的时候，使用 `--mount` 标记来将 `数据卷` 挂载到容器里。在一次 `docker run` 中可以挂载多个 `数据卷`。也可以使用 `--mount` 或者`-v`标记可以指定挂载一个本地主机的目录到容器中去。

```bash
$ docker run -d -P \
    --name web \
    # -v /src/webapp:/usr/share/nginx/html \
    --mount type=bind,source=/src/webapp,target=/usr/share/nginx/html \
    nginx:alpine
```

上面的命令加载主机的 `/src/webapp` 目录到容器的 `/usr/share/nginx/html`目录。这个功能在进行测试的时候十分方便，比如用户可以放置一些程序到本地目录中，来查看容器是否正常工作。本地目录的路径必须是绝对路径，以前使用 `-v` 参数时如果本地目录不存在 Docker 会自动为你创建一个文件夹，现在使用 `--mount` 参数时如果本地目录不存在，Docker 会报错。

在挂载的时候还可以设置容器对数据卷的读写权限。

挂载的主机目录如果原本含有文件，那么它将被隐藏。挂载点的数据将覆盖掉他们。这个和linux的mount指令是一模一样的。

#### bind mount 和 docker managed volume

docker底层提供了这两种数据卷，二者都是把一个host主机的目录挂载到docker中作为数据卷使用。他们的区别在于，在挂载数据卷的时候如果不指定mount源而只指明了挂载点，就会用docker managed volume，它会在某主机目录下，创建一个挂载源，而不是报错；挂载源的名字随机生成。这个挂载默认目录可以通过配置文件来配置。默认是`/var/lib/docker/volumes`目录。

### 5.3 数据共享

数据共享是volume的关键特性。**容器和容器之间**共享数据有三种方式。

最直接的方式就是使用mount。docker允许一个主机目录被多个容器同时挂载当做公共数据卷。

```bash
docker run container1 -d -p 80 mountdir:/volume1 httpd
docker run container1 -d -p 80 mountdir:/volume2 httpd
docker run container1 -d -p 80 mountdir:/volume3 httpd
```

这样，主机的mountdir目录将被三个容器的数据卷所共享。

另一种方式是`volume container`。`volume container`是专门为其他容器提供`volume`的容器。别的容器使用`-volumes-from`参数挂载它。实际上并不是挂载了它，而是挂载了它所设定的目录，mount源最后还是会追溯到某个主机目录。由于目前不需要了解，这里就不深入讨论了。

最后一种是`data-packed volume container`。它实现了把mount源放入容器中，是货真价实的把容器当做挂载源，把数据放在容器中。

## 6 docker网络（简略）

Docker网络为容器之间的通信提供了解决方案。无论是什么应用，基本都需要多个组件相互支持来构建，如缓存，数据库，代理服务器，等等，他们共同组成了后端。这些组件容器相互通信需要用到网络配置相关知识。

docker提供了几种原生网络。下面首先介绍这几种网络，以及自己定义的网络；然后再探讨容器之间是如何通信的，以及容器和外界如何通信。

### 6.1 none网络

顾名思义，就是无网络。在容器创建时，使用``指定。这有什么用处呢？它一般用于不需要联网，并且对安全性和封闭性要求高的容器。显式的将容器指定为不与任何外界通信，可以变相的提高其安全性。

### 6.2 host网络

连接到host网络的容器共享`Docker host`的网络栈，容器的网络配置与主机完全一致。通过`--network=host`指定。

在容器中使用`ip l`命令可以看到`host`的所有网卡，并且连hostname也是host的。host网络的最大特点就是快，它直接占用主机的端口使用。如果容器对传输速率要求很高，可以指定为host网络。这种网络的缺点是会牺牲一些灵活性。

> If you use the `host` network mode for a container, that container’s network stack is not isolated from the Docker host (the container shares the host’s networking namespace), and the container does not get its own IP-address allocated. For instance, if you run a container which binds to port 80 and you use `host` networking, the container’s application is available on port 80 on the host’s IP address.

### 6.3bridge网络

理解这一网络，需要先去学习linux虚拟网络设备相关知识。参考资料中放了一篇我觉得不错的文章。

通过桥接网络的方式，可以实现容器之间的相互通信，即让两个容器桥接到同一张虚拟网卡。

在主机中输入`ip addr show`，可以看到网桥`docker0`。这是docker在安装的时候自动创建的。容器在创建的时候，如果不指定网络`--network`，将默认挂到这个网桥上。具体原理参见：

高级网络配置<https://vuepress.mirror.docker-practice.com/advanced_network/>

### 6.4 user-defined网络

除了上述三种自动创建的网络，用户也可以根据需要自定义网络，Docker提供了三种网络驱动，桥接（bridge），overlay和 maclan。后面两种适用于跨主机的网络。

```bash
# 创建网络，-d 参数指定 Docker 网络类型
$ docker network create -d bridge my-net
# 连接网络
$ docker run -it --rm --name busybox1 --network my-net busybox sh
```

当多个容器挂到了同一个网络中时，他们就可以相互通信。可以通过`ping`指令来验证。

### 6.5 容器之间相互通信

容器之间可以通过ip, Docker DNS或者joined容器三种方式通信。

如果有多个容器之间需要互相连接，推荐使用 [Docker Compose](https://vuepress.mirror.docker-practice.com/network/compose)，它被设计用来专门管理容器集群。如果多个容器位于不同的主机上，则需要用到[Docker swarm](https://vuepress.mirror.docker-practice.com/swarm_mode/).

### 6.6 容器与外界如何通信

#### 容器 -> 外界

实现这一通信方向的技术原理是**NAT(网络地址转换)**。在主机上键入`iptables -t nat -S`查看iptables规则，会发现类似于下面的信息：

```bash
-A POSTROUTING -s 172.17.0.0/16 ! -o docker0 -j MASQUERADE
```

其含义是：如果网桥`docker0`收到来自`172.17.0.0/16`网段的外出包，就把它交给`MASQUERADE`处理。而`MASQUERADE`处理的方式是将包的源地址替换成`host`的地址送出去，即做了一次NAT(网络地址转换)。

#### 外界 -> 容器

实现这一方向依靠**端口映射**。在容器运行的时候可以通过`-p`指令指定。

```bash
# host的8080端口映射到容器的80端口
$ docker run -d -p 8080:80 container_name
```

host端口如果不指定将默认分配。亦可以指定`--network=host`来设定为与主机共用网络，这时将不再为容器分配port了。

## 7 参考文献与资料

Docker中文参考文档<https://github.com/yeasy/docker_practice>

Docker官方参考文档<https://docs.docker.com/>

Docker菜鸟教程<https://www.runoob.com/docker/>

《每天5分钟玩转Docker容器技术》清华大学出版社；

博客：Docker部署Djangohttps://pythondjango.cn/django/advanced/16-docker-deployment/

Linux虚拟网络设备之bridge(桥) - SegmentFault 思否<https://segmentfault.com/a/1190000009491002>
