# git 总结

```bash
# 常见操作
git init (--bare .git)
git remote add origin <server> # 连接远程仓库,origin是远程仓库别名
git clone # 克隆远程仓库，自动连接（执行上面的remote）
git config (--global) # 配置.git/config文件

git status
git add 
git commit -m "代码提交信息"
git push origin master # 将当前分支push到远程master分支
git log --oneline # 显示提交的历史信息。支持很多参数用于过滤

# 同步相关
git remote # 远程连接
git remote rm <name> # 移除远程连接
git fetch <remote> <branch> # 拉取远程仓库（分支）到本地
git branch -r # 查看远程分支
git merge <branch> <branch> # 合并分支。两个不同历史记录的分支（即它们不属于同一来源）默认不允许合并。
--allow-unrelated-histories # 强制合并，忽略不同来源的问题。这时两个分支的历史记录将叠加。
git pull <remote> # git fetch + git merge。

# 回滚代码
git checkout <commit> # 查看之前的提交。可以将提交的哈希字串，或是标签作为 <commit> 参数。
git checkout <commit> <file> # 替换文件为之前的版本。它将<file>文件真替换，并将它加入缓存区。
git checkout --orphan <new_branch> # 根据当前分支新建分支，并且不继承之前所有的历史记录。（需要commit一次才能真正创建）
git revert <commit> #  回退，回到<commit> *之前* 的状态，默认产生一条新的commit记录用于记录这次回退。
git revert HEAD^/HEAD~1 # 撤销前前一次 commit ，回到 前前一次 commit 之前的状态。
git revert <commit> # 回退版本
git reset <file> # 从缓存区移除特定文件，但不改变工作目录。它会取消这个文件的缓存，而不覆盖任何更改。
git reset # 重设缓冲区，匹配最近的一次提交。
git reset --hard # 重设缓冲区+工作目录，匹配最近的一次提交。（很危险）
git reset <commit> # 回滚到之前某个commit。删除中间所有的commit。

----------------------------------------------

# 分支相关
git branch # 列出所有分支
git branch <branch> # 新建分支，不会自动切换到那个分支上去。
git branch -d <branch> # 删除分支。这是一个安全的操作，Git 会阻止你删除包含未合并更改的分支。
git branch -D <branch> # 强制删除。
git branch -m <branch> # 将当前分支命名为 <branch>。
git checkout <existing-branch> # 查看特定分支，分支应该已经通过 git branch 创建。
git checkout -b <new-branch> # 创建并查看 <new-branch> （如果不存在）

# 合并分支
git merge <branch> # 将指定分支并入当前分支。
git merge --no-ff <branch> # 将指定分支并入当前分支，但生成一个合并提交（即使是快速向前合并）。
```

## 术语

- .git文件
- 工作区
- 本地仓库
- 远程仓库
- commit历史记录
- 分支

## commit提交点不能理解为一条笔直的时间线

相对于提交点组成一条时间线，把提交点理解为一个容器中的某个点更合理一些，即使这些 commit 点在时间上是有先后顺序的。而分支点则是这一堆提交点中标识整个容器头部的标识点，合并分支操作就是合并两个容器，把两个容器中的 commit 点聚在一起，前提是不产生冲突。

## add操作就是修改了版本库

我们可以把add理解为修改了版本库,commit理解为记录本次修改的操作。
add后的文件，修改了版本库，是绿色的，表示带提交记录。如果此时反悔了，可以使用

## 分离HEAD

其实就是暂时跳转到其他commit历史点上。HEAD指向“实际”的工作目录，所以分离HEAD的时候Git看起来就是一个只读模式，做的任何操作都不会影响仓库的任何内容。

## git merge的机制

`git merge` 命令允许你将 `git branch` 创建的多条分支合并成一个。

```bash
git merge <branch> #将指定分支并入当前分支。
git merge --no-ff <branch> # 将指定分支并入当前分支，但生成一个合并提交（即使是快速向前合并）。这可以用来记录仓库中发生的所有合并。
```

### 合并机制

当当前分支顶端到目标分支路径是线性之时，我们可以采取 **快速向前合并** 。这种不会产生新的历史记录。

如果分支已经分叉了，那么就无法进行快速向前合并。当和目标分支之间的路径不是线性之时，Git 只能执行 **三路合并** 。这种类似于提交了一个新的commit点，需要产生新的历史记录。

## git checkout

参数：

- 某一次提交的文件：工作目录中的 `<file>` 文件变成 `<commit>` 中那个文件的拷贝，并将它加入缓存区。头指针不变。
- 某一次提交：更新工作目录中的所有文件，使得和某个特定提交中的文件一致。但不会影响到原先的工作进度，仅仅是查看。此时头指针分离。

## git reset三种回退模式

```bash
git reset <commit> 回退到<commit> *之后* 的那个版本点。
```

- --soft：History -> Stage/Index
- --mixed：History -> Working directory，默认行为。
- --hard：History -> 垃圾桶

### 和git revert的区别

咬文嚼字：

- git revert <commit> 表示撤销commit，也就是回到<commit>的版本之前的那个版本。回退过程中，status变为reverting。如果多次修改过一个文件，就会产生冲突。这个时候我们需要进行操作，修复冲突。总之很麻烦。。revert会产生新的commit。
- git reset <commit>表示回退到<commit>，也就是回到<commit>之后的版本。

## git指令（实用型）

### 知识点1

```bash
# 配置用户名和邮箱
git config --global user.name
git config --global user.email "email@example.com".

# 为git命令配置别名 //提高效率ing
git config --global alias.a add .
git config --global alias.c commit
git config --global alias.s status

# 创建新仓库/克隆旧仓库
git init .
git clone 

# 常见操作
git add 
git status
git commit -m

# 使用gitignore忽略文件

# 从版本库中删除
git rm  # 相当于本地删除+add推送了
git rm --cached # 相当于本地删除+add推送了，之后本地又新建了一个，也就是说本地没有被删除，但是版本库里没有了。

# 从版本库中改名 
# 学这个命令只要是因为有的时候直接使用mv对文件进行大小写改名不会让版本库中名字发生变化，算是一种bug
git mv a b # 文件a改名为b，相当于在本地改了一下名字+add推送了

# log日志 
# GUI更方便的，命令行太眼花了 难看
git log
git log -p # 显示具体的文件变动信息
git log -1 # 显示最近一次的提交
git log --oneline # 显示最简要的日志
git log --name-only # 显示出哪些文件发生变化
git log --name-status # 更详细，还显示出了文件发生了什么变化

# amend并入最近的一次提交 
# 它可以让你合并你的add到上一次commit, 而不是提交一个新的快照。如果没有add需要提交，那它效果上等效于用来修正上一次的commit描述。
git commit --amend

# 关于回退的操作
git rm --cached，它删除版本库中的修改并不影响本地（上面详细介绍了），在效果上就等于回退到从前了。
```

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

## 知识点2

### develop分支与master分支

团队开发一般都是在develop分支上，master是稳定的发行版

### stash临时储存区

git要求我们在checkout切换分支的时候必须不会产生冲突。
核心：add（版本库与工作区差异的记录区）有且只有一个。add 存的是当前 commit 点与工作区所对比的“差异信息”。如果我们切换分支，git会切换commit点，将差异信息+该commit点变为工作区（这有点奇怪，但这样保持了add区的内容保持不变，小学加减法），也就是版本库和工作区的差异不变。如果可行就可行，如果不可行就产生冲突了。效果上等价于“切换分支并沿用之前的add记录”。

如果冲突，可以用暂存来copy一份当前的add差异记录，暂存在当前的分支上，让add==0，到时候恢复。（我感觉这个很nice，无论产不产生冲突都先暂存一下比较科学合理）。当然，对add=0的差异暂存没意义。

#### Untracked files

这个玩意比较特殊，我们第一次 touch 的文件属于未追踪文件，此时版本库和工作区其实已经有差异了，但是 add 是为 0 的，此时 git stash 会显示没有可以缓存的差异。因为它没有追踪到。只有在第一次 add 后才会被追踪。（但如果是修改一个文件或者删除一个文件，由于该文件已经被追踪了，所以 add 可以捕捉其差异）。

```bash
# 命令：
git stash # 暂存当前的工作进度
git stash apply ... # 恢复当前的工作进度，默认恢复最近的
git stash list # 列出所有被暂存的进度
git stash drop ... # 删除暂存
```

#### Tag标签

标签是项目阶段性的发布版本，不是随便就打的。github等网站会自动的识别git项目打的标签并列出来对应的项目包。

#### 打包项目为zip

```bash
git archive master --prefix='xxx/' --forma=zip > xxx.zip
```

#### rebase

用于管理commit记录，通过改变commit的备注和修改合并commit，让commit更合理和易懂。所以它可以优化分支合并。我们通常在merge之前要对当前分支进行rebase操作，优化好所有的commit点，然后再一次rebase到master（这效果上等效于merge，只是合并成了一条线），最后解决完所有的冲突后，由master分支的主人接收该分支，并快速向前合并到master上。

### git rebase和git merge的区别

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

## 知识点3

```bash
远程连接
git clone # 执行这条指令所在的仓库会远程连接仓库，并将远程仓库克隆到本地。（默认会为这个远程仓库搞个标识，叫做origin，省的每次都要敲一长串url来与远程交互）
git remote add origin <server> # 连接远程仓库,origin是远程仓库别名，不成规的约定就是取为origin。

远程分支管理
git branch -a //显示分支（包括远程分支）
git push //分支推送 注意：git仓库关联之后，还不能进行推送（因为推送是以分支作为单位的），把想要推送的分支和远程仓库中的某一个分支相关联，之后才能推送。
git push --set-upstream origin xxx // 将当前分支和远程origin的某个xxx分支相关联，然后把当前分支版本库同步到远程origin的xxx分支版本库。

```

## 后续补充

### 关于master和main

```bash

git branch -M main //把当前分支改名为main
# 设置上游分支：
git branch --set-upstream-to=origin/<远程分支> <本地分支>
```
