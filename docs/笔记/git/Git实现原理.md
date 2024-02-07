# Git实现原理：基于内容来寻址的文件系统

```text
HEAD
HEAD --- 存放头指针引用
index ---- 暂存区
config*  -- 仓库配置
description -- 用于 web 通信
hooks/ -- 用于git操作触发的回调
info/  -- 用于配置仓库的信息，如.gitignore
objects/ -- 实际数据存放
refs/ ---- 用于存放分支的引用
```

`description` 文件仅供 GitWeb 程序使用；`info` 目录用以放置.gitignore 文件中的忽略模式；`hooks` 目录包含客户端或服务端的钩子脚本（hook scripts）；`config` 文件包含项目特有的配置选项。

重点：

`refs` 目录存储指向数据（分支）的提交对象的指针；

`HEAD` 文件指示目前被检出的分支；

`objects` 目录存储所有数据内容；

`index` 文件保存暂存区信息。

Git 的核心部分是一个键值对数据库。 可以向该数据库插入任意类型的内容，它会返回一个键值，通过该键值可以在任意时刻再次检索（retrieve）该内容。

## hash-object

该命令可将任意数据保存于 `.git` 目录，并返回相应的键值。

```console
$ echo 'test content' | git hash-object -w --stdin
d670460b4b4aece5915caf5c68d12f560a9fe3e4
```

`-w` 选项指示 `hash-object` 命令存储数据对象；若不指定此选项，则该命令仅返回对应的键值，不存储。

```console
$ find .git/objects -type f
.git/objects/d6/70460b4b4aece5915caf5c68d12f560a9fe3e4
```

可以在 `objects` 目录下看到一个文件。：Git 存储内容的方式即一个文件对应一条内容，以该内容加上特定头部信息（header）一起的 SHA-1 校验和为文件命名。

`cat-file` 命令从 Git 那里取回数据，`-p` 选项可指示该命令自动判断内容的类型，并为我们显示格式友好的内容：

```console
$ git cat-file -p d670460b4b4aece5915caf5c68d12f560a9fe3e4
test content
```

在这个过程中，**文件名并没有被保存**，仅保存了文件的内容。这种保存的内容称为数据对象（blob object）。利用 `cat-file -t` 命令，可以让 Git 告诉我们其内部存储的任何对象类型：

```console
$ git cat-file -t 1f7a7a472abf3dd9643fd615f6da379c4acb3e3a
blob
```

## 树对象

 所有内容均以树对象和数据对象的形式存储，其中树对象对应了 UNIX 中的目录项，数据对象则大致上对应了 inodes 或文件内容。 它能解决文件名保存的问题，也允许我们将多个文件组织到一起。

一个树对象包含了一条/多条树对象记录（tree entry），每条记录含有一个指向数据对象/子树对象的指针，以及相应的文件类型（模式）、**文件名信息**。

## 暂存区

通过暂存一些文件来创建一个暂存区。`update-index` 为一个单独文件创建一个暂存区。必须为命令指定 `--add` 选项，因为此前该文件并不在暂存区中（我们甚至都还没来得及创建一个暂存区）；同样必需的还有 `--cacheinfo` 选项，因为将要添加的文件位于 Git 数据库中，而不是位于当前目录下，同时指定其文件名为test.txt，保证其与工作目录中的同名（这实际上就是git在加入暂存区的时候干的事）：

```console
git update-index --add --cacheinfo 100644 \
  83baae61804e65cc73a7201a7252750c76066a30 test.txt
```

现在，可以通过 `write-tree` 命令将暂存区内容写入一个树对象（他将自动根据暂存区创建）：

```console
git write-tree
```

现在，可以尝试更新树对象中的`test.txt`的内容：

```console
git update-index --add --cacheinfo 100644 \
  1f7a7a472abf3dd9643fd615f6da379c4acb3e3a test.txt
```

`update-index`后面可以直接跟工作目录中已经存在的文件名，即使该文件还没有加入到git数据库的blob数据对象们中。他们会被自动加入：

```console
echo 'new file' > new.txt
git update-index --add new.txt
```

暂存区现在包含了 test.txt 文件的新版本，和一个新文件：new.txt。

## 提交

提交对象（commit object）存储本次提交的信息。他也在object目录下存储。可以通过调用 `commit-tree` 命令创建一个提交对象。为此需要指定一个树对象，以及该提交的父提交对象（如果有的话）。

```console
$ echo 'first commit' | git commit-tree d8329f
fdf4fc3344e67ab068f836878b6c4951e3b15f3d

$ git cat-file -p fdf4fc3
tree d8329fc1cc938780ffdd9f94e0d364e0ea74f579
author Scott Chacon <schacon@gmail.com> 1243040974 -0700
committer Scott Chacon <schacon@gmail.com> 1243040974 -0700

first commit
```

可以看到，提交对象的格式很简单：它先指定一个顶层树对象，代表当前项目快照；然后是作者/提交者信息（依据你的 `user.name` 和 `user.email` 配置来设定，外加一个时间戳）；留空一行，最后是提交注释。

此时，实际上就得到了一条提交历史了：

```bash
$ git log --stat 1a410e
commit fdf4fc3344e67ab068f836878b6c4951e3b15f3d
Author: Scott Chacon <schacon@gmail.com>
Date:   Fri May 22 18:09:34 2009 -0700

    first commit

 test.txt | 1 +
 1 file changed, 1 insertion(+)
```

## 对象存储细节

前文曾提及，在存储内容时，会有个头部信息一并被保存。 Git 以对象类型作为开头来构造一个头部信息，对于blob对象，它是一个“blob”字符串。接着 Git 会添加一个空格，随后是数据内容的长度，最后是一个空字节（null byte）：

```js
>> header = `blob {content.length}\0`
=> "blob 16\u0000"
```

Git 会将上述头部信息和原始数据拼接起来，并计算出这条新内容的 SHA-1 校验和。最后，Git 会压缩这个文件的内容，以减少大小，并把内容写入该文件，整个blob对象的存储便完成了。

## 标签对象

标签对象（tag object）非常类似于一个提交对象，它包含一个标签创建者信息、一个日期、一段注释信息，以及一个指针。 主要的区别在于，标签对象通常指向一个提交对象，而不是一个树对象。 它永远指向一个提交对象，只不过是给这个提交对象加上一个更友好的名字罢了。

## ref引用

通过引用，可以不用SHA1哈希校验和，而使用自己定义的名字来访问某个提交点。

引用有三种：

- head引用

即当前分支的头指针。

- 标签引用

分为两种，附注标签和轻量标签。

轻量标签是一个固定的引用，它直接指向一个提交对象。而轻量标签则不同，它指向一个标签对象，通过标签对象来指向一个提交对象。

标签对象并非必须指向某个提交对象；你可以对任意类型的 Git 对象打标签。 例如，在 Git 源码中，项目维护者将他们的 GPG 公钥添加为一个**数据对象**，然后对这个对象打了一个标签。 可以克隆一个 Git 版本库，然后通过执行下面的命令来在这个版本库中查看上述公钥：

```console
git cat-file blob junio-gpg-pub
```

这个公钥相当于存储在.git的数据库中，而非在工作目录了。

- 远程引用。

如果存在一个远程版本库，并对其**执行过推送操作**，Git 会记录下最后一次推送操作时，每一个分支所对应的哈希值，并保存在 `refs/remotes` 目录下。通过这些提交对象的引用，就可以访问到推送过的仓库的所有分支了。

## 包文件

`git gc`用于git对于空间的优化。对于同一个巨型文件A修改的提交，git默认的行为是为修改的文件A创建一个全新的blob数据对象。这会大大的浪费空间。现在，磁盘上现在有两个几乎完全相同、大小非常大的对象。

这中情况有一个专有名词，称为git的“松散（loose）”对象格式。当版本库中有太多的松散对象，手动执行 `git gc` 命令，或者你向远程服务器执行推送时，Git 都会这样做，它将进行空间优化：

假设A文件的第一个版本为`033b4`，第二个版本为 `b042a`，那么打包后：

`033b4` 这个数据对象（即A文件的第一个版本）引用了**数据对象** `b042a`，即该文件的第二个版本。 是的，数据对象出现了引用。

 同样有趣的地方在于，第二个版本完整保存了文件内容，而原始的版本反而是以差异方式保存的——这是因为大部分情况下需要快速访问文件的最新版本。

## 面试

如何解释清楚git的原理？
