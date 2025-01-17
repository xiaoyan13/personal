# ProGit

总的来讲，git 中有很多违背直觉的命令和参数，他们的行为，毫不夸张地说，很反人类，往往需要画图才能理解。由于一些指令往往会导致不直观的行为，而 `git` 固执的保证向后兼容性，有很多古老的指令现在仍然能够生效并且仍被广泛的使用。

不得不讲，它实在是不能称得上是通俗易懂、简单优雅了。但它却确实是使用最广泛的版本管理工具了。

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

## git 常见术语与解读

### Untracked files

这个玩意比较特殊，我们第一次 touch 的文件属于未追踪文件，此时版本库和工作区其实已经有差异了，但是 add 是为 0 的，此时 git stash 会显示没有可以缓存的差异。因为它没有追踪到。只有在第一次 add 后才会被追踪。（但如果是修改一个文件或者删除一个文件，由于该文件已经被追踪了，所以 add 可以捕捉其差异）。


### commit提交点不能理解为一条笔直的时间线

相对于提交点组成一条时间线，把提交点理解为一个容器中的某个点更合理一些，即使这些 commit 点在时间上是有先后顺序的。而分支点则是这一堆提交点中标识整个容器头部的标识点，合并分支操作就是合并两个容器，把两个容器中的 commit 点聚在一起，前提是不产生冲突。

### 分离HEAD

其实就是暂时跳转到其他 commit 历史点上。HEAD指向“实际”的工作目录，所以分离HEAD的时候Git看起来就是一个只读模式，做的任何操作都不会影响仓库的任何内容。

### git merge 的机制

`git merge` 命令允许你将 `git branch` 创建的多条分支合并成一个。

```bash
git merge <branch> #将指定分支并入当前分支。
git merge --no-ff <branch> # 将指定分支并入当前分支，但生成一个合并提交（即使是快速向前合并）。这可以用来记录仓库中发生的所有合并。
```

#### 合并机制

当当前分支顶端到目标分支路径是线性之时，我们可以采取 **快速向前合并** 。这种不会产生新的历史记录。

如果分支已经分叉了，那么就无法进行快速向前合并。当和目标分支之间的路径不是线性之时，Git 只能执行 **三路合并** 。这种类似于提交了一个新的commit点，需要产生新的历史记录。

### git checkout

`git checkout` 命令可以用于三种不同的实体：文件，`commit` 点，以及分支。本质上，就是两个不同 `commit` 点的对比。

#### 用于分支

`check out` 的直译是"查看"的意思，然而，当前的红色变更会被应用到 checkout 的目标分支中，这也就意味着 checkout **并不是** 一个只读的操作。

这一操作可以认为是在挑选你希望修改的工作分支。工作区中的所有变更，都将会被记录在 checkout 出来的那个分支上。

我们的工作区只有一份，我们进行 checkout 的过程，实际上就是在尝试，在 checkout 的目标分支上，应用当前工作区的红色更改：我们在尝试修改目标分支。这段话十分的绕口，但它却是 checkout 的本质。

在绝大部分的情况下，我们在 checkout 到其他分支之前，都会保证当前的工作区是干净的，通俗来说就是没有红色、绿色的文件。

#### 用于文件（夹）

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

#### 用于 commit 点

这会让你切换到该 commit，进入一个“分离”状态。通俗解释就是，在这个状态下，你可以查看和操作文件，但任何新的提交都会在你 checkout 回最新的 commit 点的时候被抛弃。如果不想抛弃，就先开根据当前提交点开叉一条分支：

```bash
git checkout -b new-branch
```

然后，再将这个新的分支合并到之前的分支。所以我们一般并不怎么用，仅仅是用作审阅过去的记录，但是这一点也已经被成熟的 UI 可视化图线淘汰掉了。

**总之，一个最佳实践就是，如果你对 checkout、rebase 等等操作不是很熟悉，尽量保证当前工作区是干净的(一般使用 `git stash`)。这样，无论如何操作，都不会导致数据丢失。**

### git revert

咬文嚼字：

- `git revert <commit>` 表示撤销 commit，也就是回到 `<commit>` 的版本之前的那个版本。回退过程中，status变为reverting。如果多次修改过一个文件，就会产生冲突。这个时候我们需要进行操作，修复冲突。总之很麻烦。。revert会产生新的commit。
- `git reset <commit>` 表示回退到 `<commit>`，也就是回到 `<commit>` 之后的版本。

---

```txt
分支的概念：分支其实就是不同的线，每条线上记录了各自的修改（commit）记录。
分支常见操作：
创建分支/切换分支/合并分支/删除分支

分支合并冲突的产生与解决
产生的原因向军的视频中阐述的很清楚：我们的a和b分支都是从主分支的某一个提交点（称作点HD）分出来的，各自操作完后都想合并到主分支，但他们都修改了某个文件f。我们把a合并到主分支后，再试图把b分支合并到主分支，那个修改的文件f的提交点就会产生冲突：当我们尝试把b分支合并到主分支的时候，git从HD点开始不断并入所有的commit提交点，以合并所有的修改，但是遇到了文件f的修改，发现产生了冲突：它之前已经有一个提交点了。这个时候git会把没产生冲突的commit的点全部并入之后进入merging状态。
解决方法就是手动去操作。git在合并产生冲突的时候会进入merging状态，此时我们可以查阅冲突的文件并修改，进行add和commit，直到merging状态的工作区全变干净，这时就表明已经完成合并，自动退出merging状态。

分支管理
git branch --merged # 查看哪些分支已经合并到当前分支过了
git branch --no-merged # 查看哪些分支还没有合并到当前分支过
git branch -d # 删除分支。只能删除已经进行合并操作过的分支。如果要对没有合并过的分支进行删除，使用-D。

```

### git stash: 临时储存区

git要求我们在checkout切换分支的时候必须不会产生冲突。
核心：add（版本库与工作区差异的记录区）有且只有一个。add 存的是当前 commit 点与工作区所对比的“差异信息”。如果我们切换分支，git会切换commit点，将差异信息+该commit点变为工作区（这有点奇怪，但这样保持了add区的内容保持不变，小学加减法），也就是版本库和工作区的差异不变。如果可行就可行，如果不可行就产生冲突了。效果上等价于“切换分支并沿用之前的add记录”。

如果冲突，可以用暂存来copy一份当前的add差异记录，暂存在当前的分支上，让add==0，到时候恢复。（我感觉这个很nice，无论产不产生冲突都先暂存一下比较科学合理）。当然，对add=0的差异暂存没意义。

```bash
# 命令：
git stash # 暂存当前的工作进度
git stash apply ... # 恢复当前的工作进度，默认恢复最近的
git stash list # 列出所有被暂存的进度
git stash drop ... # 删除暂存
```

### Tag标签

标签是项目阶段性的发布版本，不是随便就打的。github等网站会自动的识别git项目打的标签并列出来对应的项目包。

```bash
git tag # 查看当前仓库的标签
git show 'tag-name' # 查看标签对应的提交信息 

git tag 'tag-name' -m "comments" <commit> # 创建轻量标签
git tag -a 'tag-name' <commit> # 创建附注标签

git push origin 'tag-name' # 推送单个标签
git push --tags # 推送所有标签 
git push --follow-tag # 推送标签 + commit 记录

git checkout -b new_branch 'tag-name' # 根据标签提交记录创建一个新分支
```

### 打包项目为 zip

```bash
git archive master --prefix='xxx/' --forma=zip > xxx.zip
```

### git rebase

用于管理commit记录，通过改变commit的备注和修改合并commit，让commit更合理和易懂。所以它可以优化分支合并。我们通常在merge之前要对当前分支进行rebase操作，优化好所有的commit点，然后再一次rebase到master（这效果上等效于merge，只是合并成了一条线），最后解决完所有的冲突后，由master分支的主人接收该分支，并快速向前合并到master上。

#### git rebase和git merge的区别

二者都可以用于合并分支。

本质上，git merge用于把两个分支进行合并操作：它是直接的合并，也就是直接把两个分支的commit点混在一起。这在log日志中的表现形式便是一个merge记录，里面两条线，最后合并在一起。如果合并的过程可以看做“快速向前合并”，则不会产生log日志。

git rebase可以用于管理commit点：

```bash
git rebase -i [startPonit] [endPoint]
```

关于这条指令可以参考[这里](https://juejin.cn/post/7035512330662182920)。

也可以用于合并分支（本质上还是管理commit点，就是把commit合并成一条线）：

```bash
git rebase master
```

这条指令，可以理解为先把当前分支的commit点隐藏起来（清空commit容器），然后把master的commit全部载入当前容器中，再把之前隐藏的commit按照时间线的顺序一个个重新装载到该容器里（这个过程可能会产生冲突，所以rebase过程需要解决冲突，所以我们rebase之前，当前的commit线路最好一定是非常干净整洁的，要不然会产生很多冲突，比如都修改了a文件，但当前分支的a文件被commit了两次，就需要解决两次冲突。）。这在log日志中就不会形成两条线了，而是一条完整的继承自master的线。**效果上就是把分支点往后移动到master了**。

### git reset

对于最基本的用法，分支回滚到之前的某个提交上。下面的`绿`和`红`虽然看起来排版并不好看，但却很直观的解释了 `reset` 的原理：

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


### .gitignore

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

### 指针指向

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

## 边角知识

- git hock
- 调试 git
- 第三方 IDE/editor 集成 git
- ...

### 关于master和main

很多设备上的 `git` 版本仍然新建仓库以 `master` 作为主分支名。就现在 `master` 和 `main` 一直混在一起的现状而言，新建一个仓库直接手动把 `master` 给删掉，是一个好习惯。

```bash
git branch -M main //把当前分支改名为main
# 设置上游分支：
git branch --set-upstream-to=origin/<远程分支> <本地分支>
```
