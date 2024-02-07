# GDBUsing

## [参考](https://web.eecs.umich.edu/~sugih/pointers/summary.html)

## summary

- 为可执行文件添加调试信息（-g）
- 进入gdb，file选中文件
- list加行号显示程序，默认还没运行程序位于文件开头，后面使用l会往后补程序，每次10行；list后面也可以跟函数名；
- 添加断点break
- info breakpoints;查看断点，delete跟断点号删除断点，clear,cl后跟函数或者行号。

- 运行程序r
- 常用指令next, step, until,continue;
- print,p打印值

## 一些违反直觉的事情

`next`不同于`step`，它在行为上也是只往下跳转一行，但不进入函数

`until`会继续运行程序，如果它开始执行的时候本身位于循环尾部（准确来说是，它即将运行进入一个循环），则它会直接运行完这个循环，直到下一个断点。否则它的效果和`next`相同。

函数声明行本身是不占断点的。函数入口在`{`所在的位置；

出去`main`函数之后，通过`cotinue`来正确结束程序；此时如果键入`next`或者`until`、`step`可能会有奇怪的报错（具体原因未知）
