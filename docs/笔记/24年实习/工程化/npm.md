# npm

对于一个项目而言，最终肯定是要拿来用的。至于怎么用，有两种方式：

- 被开发者使用，以库的形式。

- 被用户使用，用于跑生产环境。

`npm` 作为包管理工具，给我们提供了第一种方式的解决方案。所有的 `js` 项目/库，无论是打包后的还是没有打包的，都通过一个叫做 `package.json` 的文件联系起来，互相认识。

## 库与依赖

安装和使用一个库很简单：

```bash
npm install (with no args, in package dir)
npm install <tarball file>  # 安装位于文件系统上的包。
npm install <tarball url>   # 获取 url，然后安装它。为了区分此选项和其他选项，参数必须以“http://”或“https://”开头。
npm install <folder>        # 安装位于文件系统上某文件夹中的包
npm install [<@scope>/]<name>                 # 安装指定的包的最新版本。
npm install [<@scope>/]<name>@<tag>           # 安装被 tag 引用的包的版本。如果 tag 不存在于该包的注册表数据中，则失败。
npm install [<@scope>/]<name>@<version>       # 安装指定的包的版本。如果版本尚未发布到注册表，则失败。
npm install [<@scope>/]<name>@<version range> # 安装与指定版本范围相匹配的包版本。
```

但无论是使用库，还是一个安装库，都必须要考虑这个库的 **定位**。一个库的定位取决于自己的项目要拿这个库干什么。根据不同的定位，`npm` 在**打包阶段**当前项目时对依赖的处理和**下载时**对依赖的态度会变化。定位有几种：

- `bundledDependencies`：最简单的情况，这些项目依赖，是我的项目在 `npm pack` 打包时就**进行处理**的，它们一开始在我的项目发布时，就被打进了我的包中，所以他会增大最终的 `js` 文件的体积。
- `dependencies`：这些项目依赖，是我的项目在 `npm pack` 打包时**不进行处理**的，但发布后，别人正常使用我的库（项目）时却需要它们。库在被下载的时候，`package.json` 中的所有 `dependencies` **会自动安装**。
- `peerDependencies`：和 `dependencies` 完全相同，唯一不同的是，它**不会自动安装**。这意味着，如果自己的环境中没有事先拥有想安装的库的 `package.json` 中的 `peerDependencies`，或者版本不匹配， `npm` 抛出警告，让你先安装。也可以通过 `optional` 选项来标识此依赖其实是可选的，不需要抛出警告。
- `optionalDependencies`：可选依赖。意味着该依赖是可选的，打包项目的时候不会管这个依赖，打包发布后别人下载的时候，看到 `package.json` 的 `optionalDependencies` 有依赖也会先尝试去下载，如果下载失败也不会报错。
- `devDependencies`：这个库不是 *自己的项目给别人用时所必须的*。只是用于开发的库，打包后不需要该库就能正常运行。`npm` 无论在打包的时候会忽略该字段下的依赖，并且在打包发布后，别人 `npm` 下载使用的时候，也会忽略这个 `package.json` 的 `devDependencies` 字段。典型的例子比如语法检查库 `eslint`。

下面是一些安装时的参数，规定了使用的库的定位：

-S, --save - 包将被添加到 dependencies。
-D, --save-dev - 包将被添加到 devDependencies。
-O, --save-optional - 包将被添加到 optionalDependencies。

这些参数对于 `uninstall` 同样生效。

当使用上述任何选项将依赖保存到 package.json 时，有两个额外的可选标志：

-E, --save-exact - 会在 package.json 文件指定安装模块的确切版本。
-B, --save-bundle - 包也将被添加到 `bundleDependencies`。

## 更新

```bash
npm update [-g] [<pkg>...]

aliases: up, upgrade
```

### tag

npm 允许的版本声明方式十分多样:

- `version` - 安装一个确定的版本，遵循“大版本.次要版本.小版本”的格式规定。如：1.0.0。
- `~version` - 以 ~1.0.0 来举例，表示安装 1.0.x 的最新版本（不低于 1.0.0）。但是大版本号和次要版本号不能变。
- `^version` - 以 ^1.0.0 来举例，表示安装 1.x.x 的最新版本（不低于 1.0.0），但是大版本号不能变。
- `>、>=、<、<= -` 可以像数组比较一样，使用比较符来限定版本范围。
- `version1 - version2` - 相当于 >=version1 <=version2.
- `range1 || range2` - 版本满足 range1 或 range2 两个限定条件中任意一个即可。
- tag - 一个指定 tag 对应的版本。
- `*` 或 `""` (空字符串)：任意版本。
- git... - 直接将 Git url 作为依赖包版本
- `user/repo` - 直接将 Git url 作为依赖包版本

#### 直接将 Git url 作为依赖包版本

Git Url 形式可以如下：

```bash
git://github.com/user/project.git#commit-ish
git+ssh://user@hostname:project.git#commit-ish
git+ssh://user@hostname/project.git#commit-ish
git+http://user@hostname/project/blah.git#commit-ish
git+https://user@hostname/project/blah.git#commit-ish
```

## 发布

```bash
npm publish [<tarball>|<folder>] [--tag <tag>] [--access <public|restricted>]
```

## 调试脚本

这里的思路是，对于一个个库引入和使用，他们除了作为项目代码本身的依赖来使用，还可以作为开发过程中的工具来使用。所以 `npm` 在 `package.json` 中提供了一个 `scripts`，配合 `npm run xxx` 来实现功能，他会去 `node_modules` 中的 `.bin` 文件夹中寻找到目标命令文件（这个文件是在该库在安装的时候就顺带下载好的），然后运行它并返回。

如果想要在自己的项目中提供命令给别人使用，`package.json` 提供 `bin` 字段。

```json
{
  "name": "your-package",
  "version": "1.0.0",
  "bin": {
    "my-command": "./bin/my-command.js"
  }
}
```

在这个示例中，在自己的项目打包的时候，`bin` 会被打包成可执行文件，别人下载自己的库的时候该二进制文件会被丢到 `node_modules` 下的 `.bin` 文件夹下。

## Hooks

### prepare

在包被发布前（npm publish）和包被安装为依赖（npm install）时执行。

具体执行时机包括：

- 在本地开发时，运行 npm install 或 npm link。
- 在发布包时，npm publish 会先运行 prepare 脚本。

常用于构建任务，比如编译 TypeScript 或打包模块。

### prepublish

在 `npm publish` 命令执行前，以及 `npm install`（没有参数时）执行。由于这个钩子在不同场景下都会被触发，因此可能会导致意外行为。为了更精确地控制脚本的执行，通常推荐使用 prepublishOnly 或 prepare。

### prepublishOnly

只在包被发布前执行，不会在安装时触发。适合在发布之前进行构建或其他只在发布时需要的任务。

## 用于生产环境

// todo

## 最后

包管理工具只有 `npm` 是不够用的，比较常用的还有包管理器 `pnpm`，`yarn`，`node` 版本管理器 `nvm` 等等。他们都是工程化的最基础的工具。
