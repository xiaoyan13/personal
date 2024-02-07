# C/C++结构体的一个特性

## 区别

C++的结构体实际上就是一个类。它和C++的类的唯一一个区别仅仅在于，它的所有属性默认的访问权限是`public`。

## 引例

来看一段C代码：

```C
typedef struct Node {
    struct Node *next;
} Node;
```

和一段等价的C++代码：

```c++
typedef struct Node {
    Node *next;
} Node;
```

这是一个看起来有点儿”奇怪“的写法。我们来分析一下代码：

- 第一个Node在C中是结构体标签（Tag）；在C++中它变成了类名；
- C++第二个Node是`struct Node`的简写。是的，在C++中，结构标签被允许进行简写：我们在定义结构体变量的时候，类型不需要写前面的`struct`关键字了。
- 第三个Node是typedef的语法，表示定义了一个`Node`类型。

## Tag处理：问题分析

那么问题来了，基本上，C不允许在同一作用域中出现重名的个体。我们这样定义出现了两个Node，不会报错吗？

不会。C对待tag不同于其它标识符。C编译器将tag保存在一个符号表中，在概念上（而非物理上）与符号表中其它的标识符分离。因此，C程序员可以在同一作用域中拥有同名的tag和标识符。我们定义一个Node类型的变量的时候，可以写成：

```C
Node a; //valid, use your typedef
struct Node a; //valid, use your struct Tag
```

而对于C++，没有了标签的概念，但我们仍然可以使用`struct Node`：

```C++
Node a; // valid, use your typedef
struct Node a; //valid, use your struct Tag
class Node a; //valid, for C++ struct is a class
```

所以说，在C++中：

```C++
typedef struct Node {
    Node *next;
} Node;

//equals to..
typedef class Node {
    public:
        Node *next;
} Node;
```

我们知道了C编译器会单独的处理标签，才不会产生命名冲突。那么C++是如何处理类名的呢？

C++类的语法是C的结构语法的扩展。尽管C++标准没有管类名叫tag，类的名字实际上非常像tag。例如，我们可以这样写：

```c++
string s; // valid
class string s; //valid!
```

当然，很少有人真的这么做。C++设计简写的目的就是为了省略掉前面的class/struct关键字。没必要违背这个初心：C++让我们尽可能的把自己的类型用起来很像内建类型——我们使用自己的struct或者class的时候，没有必要再在前面加struct/class来声明Tag作用域了。

原理上，我们可以想象C++自动为每一个tag生成了一个typedef：

```C++
typedef class string string;
```

当然，这并不是真正的原理。但它确实拥有类似这样的行为。C++为每一个标签（类名）起了一个别名：他们的行为和typedef及其相似，但并不是真正的typedef。具体表现上来说，标签（类名）简写的优先级会低于一个真正的类型定义（或typedef）：

```c++
void Node() {
 return ;
}

struct Node
{
    struct Node *A;
    int a;
};

int main() {
    Node();
    struct Node a;
    return 0;
}
```

上面的代码是跑的通的：第一次Node的函数类型优先级高于标签Node。第二次我们使用了struct Node来指明，要使用的是标签命名空间中的Node，所以它没有使用函数类型。

这看起来非常奇怪，这也是一种不良的代码方案。我查到的推荐准则是：

***对每一个tag，在同一作用域中定义一个同名的typedef作为tag的别名。***

对于每一个class/struct，都显式的定义一个和标签同名的typedef。这种风格在C和C++都能正常的运行：

```C
typedef struct Node Node; 

struct Node {
    Node *A;
    int a;
};
```

对每一个class，你可以把typedef定义在类定义前面或后面（C++中的class包括结构和联合）。把typedef放在类定义之前可以让你让你在类中使用typedef的定义。

## 结语

> 应当承认，tag名被屏蔽印发错误的进率看起来很小。你可能永远不会遇到这样的问题。但是一旦这样的错误出现就很致命，所以你还是应该使用typedef不管这种错误发生几率有多小。
>
> 我不能理解为什么有人允许在同一作用域中让函数或对象名屏蔽类名。这种屏蔽规则在C中是一个失误，本不应该在C++中继续存在。你需要付出更多的编程努力来避免这个问题。

## 参考

[C/C++的tag和type：一个设计失误](https://www.cnblogs.com/sirlipeng/p/4538996.html)

[C++Tag简写的来历](https://cloud.tencent.com/developer/article/1942082)
