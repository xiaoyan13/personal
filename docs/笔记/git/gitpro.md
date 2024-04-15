# GITPRO

总的来讲，git 中有很多违背直觉的命令和参数，他们的行为，毫不夸张地说，很反人类，往往需要画图才能理解。由于一些指令往往会导致不直观的行为，而 `git` 固执的保证向后兼容性，有很多古老的指令现在仍然能够生效并且仍被广泛的使用。

不得不讲，它实在是不能称得上是通俗易懂、简单优雅了。但它却确实是使用最广泛的版本管理工具了。

## 新增速查表
```bash
git commit --amend # 提交，并且和上次提交合并，用于提交完了发现少数几个文件还要修改一下，或者提交信息写错
git restore # 同 git checkout -- <file>

git reset HEAD xxx # reset 的默认行为是 --mixed, 即绿色 -> 红色 取消暂存的文件, 暂存的绿色文件回退到工作目录
git restore --staged # 同上

git branch -vv # vv 是 very verbose 的缩写 能够显示分支的上游分支
git push --set-upstream origin your_branch:upstream_branch # 在 push 的时候设置上游
git push -u origin your_branch:upstream_branch # 同上
git branch -u origin/upstream_branch your_branch # -u 是指定上游分支的意思
git branch -d # 删除分支

git stash -u # 默认不会暂存未追踪的文件，加上 -u 会加上，很有用
git stash apply --index # 暂存的暂存区文件在 apply 时默认不会自动重新加入暂存区(变绿)，加上 index 将会尝试重新加入缓存区
```

## 初次学习顺序记录

```bash
什么是git
版本控制简史，各种git了解
git的特性：Git 一般只添加数据，git保证完整性（哈希校验和），几乎所有操作都是本地执行，记录快照而非差异比较
---
安装与配置git，windows/linux下的配置文件存放说明
文本编译器说明，杂项
---
git init, .git目录
---
git status: 两种状态：已追踪与未追踪
基本操作：modified、git add->staged、git commit->快照，以及对new文件两种状态的说明
（快照 -- 缓存区 -- 当前目录）方向模型
rm 后 git add 的说明
---
git diff # 此命令是工作目录中当前文件和暂存区域快照之间的差异，也就是还没有暂存起来的变化内容。
git diff --staged # 暂存区和 commit 点的差异，也就是已暂存的、将要添加到提交里的内容
git restore, git restore --staged
---
中途休息：
.gitignore的原理，以及他本身会不会被git忽略
git status -s，git add .，git commit -m, git commit -a 等快捷键
git别名提升体验
git mv的原理
---
git rm
git rm --cached
---
git log以及常用参数
git tag
---
blob 对象（文件快照），树对象与提交对象，分支指针与HEAD指针
git branch，checkout 案例模拟
git merge，fast-forward 和 diverged，最优公共祖先与画图模拟
常见分支使用方式：主线型和任意型
---
git rebase
---
git应当具备的能力：网络通信和权限管理
4种协议，权限管理
github
---
以分支为单位谈起
git remote
远程追踪分支，git fetch
git checkout/merge，git clone
---
git push
git pull
---
多人协作时的工作流图像，提交规约
小型团队案例分析：反复的 git fetch+git push
维护项目
---
git stash
```

## 边角知识

```bash
git tag
git hock
调试
第三方 IDE/editor 集成的git
各种各样的参数
...
```

## git checkout

`git checkout` 命令可以用于三种不同的实体：文件，`commit` 点，以及分支。本质上，就是两个不同 `commit` 点的对比。

### 用于分支

`check out` 的直译是"查看"的意思，然而，当前的红色变更会被应用到 checkout 的目标分支中，这也就意味着 checkout **并不是** 一个只读的操作。

这一操作可以认为是在挑选你希望修改的工作分支。工作区中的所有变更，都将会被记录在 checkout 出来的那个分支上。

我们的工作区只有一份，我们进行 checkout 的过程，实际上就是在尝试，在 checkout 的目标分支上，应用当前工作区的红色更改：我们在尝试修改目标分支。这段话十分的绕口，但它却是 checkout 的本质。

### 用于文件（夹）

用于文件的特征是加了 `--`：

```bash
git checkout main    # 检出分支
git checkout -- main # 检出文件
```

之所以要用 `--`，是处于保险起见，因为 `<file>` 可能和分支名一样而造成歧义。不加也行，一律最好加上。

`git checkout` 用于文件，表示自己放弃所有的修改（红+绿），把当前工作区的文件变为目标 `commit` 点的相应文件。

默认的 `commit` 是 `HEAD`，即最近的一次提交。

```bash
git checkout [<commit>] -- <file>
```

值得注意的是，这里会产生一个混乱。当使用 `git checkout` 命令将文件切换到某个提交点的版本之前，该文件已经在暂存区（绿色），那么在 `checkout` 后，暂存区的修改也会随之变化，这会很迷惑人，而且往往不是我们想要的行为。

### 用于 commit 点

可以把这种情况，等价于：

```bash
git checkout <commit> -- ./
```

就是用于文件的情况。

### git reset

对于最基本的用法，分支回滚到之前的某个提交上：

执行前：|目标提交|其他提交|....|绿|红。

git reset: |目标提交|红|红|...|红|红。

git reset --soft：|目标提交|绿|绿|...|绿|红。

git reset --hard：|目标提交|。

可以看到， `git reset` 可以理解为单纯的把路径上的提交点变红/绿，或者之间丢弃。

```bash
# 软重置：这会将分支指针移动，但保留暂存区和工作目录。你可以重新提交这些更改。
git reset --soft 
# 混合重置：默认的 git reset 模式。
git reset (--mixed)
# 硬重置：同时丢弃暂存区和工作目录中对该提交之后的所有更改。
git reset --hard 

git l
```

我实验了使用 `git reset` 进行分支重置到未来的某个提交上（类似于 `git fetch + git pull` 但不相同，它可保留绿色/红色），结果产生了混乱。

具体来讲，我当前的工作点的某文件 `test.js` 是空的，而最新的提交点上该文件是有内容的。

当我尝试在重置到后方(未来)的最新提交的时候：

```bash
git reset --soft last_commit_point
```

一切看起来是正常的，我的确被重置到了最新的提交点，此时暂存区出现了绿色文件。值得注意的是，绿色文件并不记录了我新增了什么内容，而是反过来记录说，我删除了某些内容。这也很好理解，反向的记录绿色了，正向提交是新增内容，反向就是删除了。

对于这样一个有趣却古怪的行为，建议是尽可能的避免。也就是说，`reset` 本就是设计用来进行回滚操作的，不要破戒。

话虽如此，对于 `git reset --hard`，由于它会完全的放弃所有的更改(包括当前的绿/红, 和中间的提交点)，所以它能够用于快速的直接强制和最新提交保持一致：

```bash
git reset --hard last_commit_point # 放弃当前的所有修改，包括红色和绿色暂存区，直接跳到目标提交点上。
```
这算是 `reset` 唯一一个有用而且不遭到麻烦的"奇技淫巧"了。

## .gitignore

`.gitignore` 文件只影响未跟踪的文件，也就是说，如果某个文件已经被纳入版本控制系统，那么就算在`.gitignore` 文件中规定了忽略它，它仍然会被版本库追踪。所以，如果一个文件还在 `git` 中，那么在此之后创建 `.gitignore` 文件并提交并不会影响 `git` 对它的追踪：此后下游对该版本库的 `pull\push` 操作，在版本库交接的时候都不会忽略该文件，因为它还在被 `git` 追踪。

解决：

```bash
git rm --cached <文件> # 删掉文件，本地保留
git commit
```

执行完后将在本地保留该文件，并且版本库中已经删除掉该文件，不再追踪。

此后其他人 `pull/push`，都会忽略自己本地的该文件。但是 `pull/push` 时如果他对该文件进行过修改，那么需要解决一些冲突，我们可以单独开一个暂存区，用一个单独的 `commit` 点来处理这个冲突，而不是直接合并的时候解决，这样比较优雅：

```bash
# 先暂存对该(类型)文件的修改
git stash *.xx
# 再拉取，此时不会产生冲突，因为本地修改已经被暂存：
git pull
# 再将暂存的修改, 应用到新提交点
git stash apply
# 这个时候会出现冲突:
# CONFLICT: deleted in Updated upstream and modified in Stashed changes.
# 提示修改的文件在该提交点已经不存在了，即之前将它被删掉了，而且现在也不再追踪了，但是我们暂存的修改却修改了它。需要手动解决冲突。
# 此时暂存区显示红色的 modified，也就是说，它还是强制的记录了我们的修改记录，假设我们在工作目录中修改了它...宁可记录，不愿丢弃任何记录，是 git 的一个特点。
git add . # 使用 git add . 把这个修改记录加入暂存区并 commit
git c -m "xx 文件之前被加到 .gitignore, 该文件现在被删除不再追踪，但我在这之前修改过它, 这个 commit 点用于记录之前对这个文件的修改。"
```

## 指针指向

```bash
# 查看头指针指向的提交的哈希值：
git rev-parse HEAD
```

`HEAD~` 和 `HEAD^` 是等价的。 而区别在于后面加数字： `HEAD~2` 代表 “父提交的父提交”，同 `HEAD^^`。


## Idea | 警语

git 是一个行级的DVCS。

添加文件导致新增的未追踪文件，此时不允许 `commit -a` (不经过暂存直接提交)。

- `git restore <file>` 表示去除红色（不影响绿色），即回退工作目录到上次提交。`--staged` 参数表示回退绿色暂存区到上次提交，即绿色变为红色。

- 对于一个已经被 git 追踪的文件(无论是否修改后被记录在暂存区)：
  - `rm` 之后 `git add/rm`，此时暂存区会覆盖之前对文件的修改，即显示绿色的deleted。
  - 直接 `git rm`，相当于 `rm + git add`，表示想要直接从暂存区丢弃该文件。这种行为会覆盖之前对文件的修改（而且仅仅只有一条指令），所以暂存区有绿色的 `modified`（或有绿色 `new file`）的时候，不允许直接这样做，需要加 `-f(force)` 强制覆盖之前的行为。
  - `git rm` 加上 `--cached` ，表示将绿色的 `modified/new` 内容先回退到本地变为红色。(`git rm --cached` 相当于将`git rm` 操作中的第一步*删除文件操作*变为*将文件改为未追踪态*，此时文件未追踪所以 `git` 看不到，所以 `git add` 相当于删除了文件；下一次快照将不再追踪该文件。) 当然，也可以简单理解为它就是先保存了一份原文件的拷贝，然后在执行完 `git rm` 后，把文件拷贝到目录下，此时文件理所当然的未被追踪。

- 有一些方法可以绕过暂存区未保存但想要切换分支这个问题，但最好的方法是，在切换分支之前，总保持一个干净的状态。

- git pull = git fetch + git merge。

- **重要公式：下次提交 = |上次提交|绿|红|**

- git mv 的原理：

```bash
git mv README.MD README
# equals to
mv README.MD README # 现在，README.MD被删除，新建README，并且README文件内容和MD文件一样
git add . # 提交操作，自动识别为rename操作。
```
