# GITPRO

## Idea

git是一个行级的DVCS。

添加文件导致新增的未追踪文件，此时不允许commit -a

git restore `<file>`表示去除红色（不影响绿色），即回退工作目录到上次提交。--staged参数表示回退绿色暂存区到上次提交，即绿色变为红色。

rm之后git add/rm，此时暂存区会覆盖之前对文件的修改，即显示绿色的deleted。

直接git rm，表示想要直接从暂存区丢弃该文件，相当于本地rm+git add。这种行为会覆盖之前对文件的修改（而且仅仅只有一条指令），所以暂存区有绿色的modified（或new file）的时候，不允许直接这样做，需要加-f（force）强制覆盖之前的行为。

git rm加上--cached，表示将绿色的modified(new)内容先回退到本地变为红色。（git rm --cached 相当于将git rm操作中的第一步*删除文件操作*变为*将文件改为未追踪态*，此时文件未追踪所以git看不到，所以git add相当于删除了文件。下一次快照将不再追踪该文件 )

有一些方法可以绕过暂存区未保存但想要切换分支这个问题，但最好的方法是，在切换分支之前，总保持一个干净的状态。

git pull = git fetch + git merge。

**重要公式：下次提交 = |上次提交|绿|红|.**

```bash
git mv README.MD README
==== equals to ====
mv README.MD README # 现在，README.MD被删除，新建README，并且README文件内容和MD文件一样
git add . # 提交操作，自动识别为rename操作。
```

## study Ordering

```bash
什么是git
版本控制简史，各种git了解
git的特性：Git 一般只添加数据，git保证完整性（哈希校验和），几乎所有操作都是本地执行，记录快照而非差异比较
---
安装与配置git，windows/linux下的配置文件存放说明
文本编译器说明，杂项
---
git init,.git目录
---
git status，两种状态：已追踪与未追踪
基本操作：modified、git add->staged、git commit->快照，以及对new文件两种状态的说明
（快照 -- 缓存区 -- 当前目录）方向模型
rm后git add的说明
---
git diff, git diff --staged
git restore, git restore --staged
---
中途休息：
.gitignore的原理，以及他本身会不会被git忽略
git status -s，git add .，git commit -m, git commit -a等快捷键
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
git branch，checkout案例模拟
git merge，fast-forward和diverged，最优公共祖先与画图模拟
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
小型团队案例分析：反复的git fetch+git push
维护项目
```

## MoreThings

```bash
git tag
git hock
git stash
调试
第三方IDE/editor集成的git
各种各样的参数
...
```

### git分支如何回滚到某个提交上

执行前：|目标提交|绿|红|....|绿|红。

git reset: |目标提交|红|红|...|红|红。

git reset --soft：|目标提交|绿|绿|...|绿|红。

git reset --hard：|目标提交|。

```bash
# 软重置：这会将分支指针移动，但保留暂存区和工作目录。你可以重新提交这些更改。
git reset --soft <commit-hash>
# 混合重置：默认的 git reset 模式。
git reset --mixed <commit-hash>
# 硬重置：同时丢弃暂存区和工作目录中对该提交之后的所有更改。
git reset --hard <commit-hash>

# 查看头指针指向的提交的哈希值：
git rev-parse HEAD
git l
```

## .gitignore

`.gitignore` 文件只影响未跟踪的文件，也就是说，如果某个文件已经被纳入版本控制系统，那么就算在`.gitignore` 文件中规定了忽略它，它仍然会被版本库追踪。所以，如果一个文件还在git中，那么在此之后创建.gitignore文件并提交并不会影响git对它的追踪：此后下游对该版本库的pull\push操作，在版本库交接的时候都不会忽略该文件，因为它还在被git追踪。

```bash
git rm --cached <文件>
git commit
```

执行完后将在本地保留该文件，并且版本库中已经删除掉该文件，不再追踪。此后其他人pull/push，都会忽略自己本地的该文件。但是此时如果他对该文件进行过修改，此时那么需要解决一些冲突：

```bash
# 先暂存对该文件的修改
git stash
# 再拉取：
git pull
# 再将暂存到栈的修改应用到该新提交点
git stash apply
# 这个时候会出现冲突，提示修改的文件在该提交点已经不存在，需要手动解决冲突，我们直接add表示不删除该文件：
git add .
git c -m "解决一次冲突"
```
