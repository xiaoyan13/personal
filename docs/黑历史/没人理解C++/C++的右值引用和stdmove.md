# C++的右值引用和std::move

## 1.什么是左值和右值

左值**可以取地址、位于等号左边**；而右值**没法取地址，位于等号右边**。

```c++
struct A {
    A(int a = 0) {
        a_ = a;
    }
 
    int a_;
};
 
A a = A();
```

- a可以通过 & 取地址，位于等号左边，所以a是左值。
- A()是个临时值，没法通过 & 取地址，位于等号右边，所以A()是个右值。

有地址的变量就是左值，没有地址的字面值、临时值就是右值。

## 2.什么时刻左值引用和右值引用

引用本质是别名，可以通过引用修改变量的值，传参时传引用可以避免拷贝.

### 2.1 左值引用

简称引用，**指向左值的就是左值引用**。

```C++
int a = 5;
int &ref_a = a; // 左值引用指向左值，编译通过
int &ref_a = 5; // 左值引用指向了右值，会编译失败
```

**引用是变量的别名，由于右值没有地址，没法被修改，所以左值引用无法指向右值。**

但是，const左值引用是可以指向右值的：

```c++
const int &ref_a = 5;  // 编译通过
```

const左值引用不会修改指向值，因此可以指向右值.这也是为什么要使用`const &`作为函数参数的原因之一，如`std::vector`的`push_back`：

```C++
void push_back (const value_type& val);
```

如果没有`const`，`vec.push_back(5)`这样的代码就无法编译通过了。所以才这样设定。

### 2.2 右值引用

右值引用的标志是`&&`，顾名思义，右值引用专门为右值而生，**可以指向右值，不能指向左值**：

```C++
int &&ref_a_right = 5; // ok
 
int a = 5;
int &&ref_a_left = a; // 编译不过，右值引用不可以指向左值
 
ref_a_right = 6; // 右值引用的用途：可以修改右值
```

### 2.3 对左右值引用的本质进行讨论

#### 2.3.1 一个函数std::move

**右值引用有办法指向左值吗？**有办法，`std::move`将左值转化为右值后，被右值引用指向：

```C++
int a = 5; // a是个左值
int &ref_a_left = a; // 左值引用指向左值
int &&ref_a_right = std::move(a); // 通过std::move将左值转化为右值，可以被右值引用指向
 
cout << a; // 打印结果：5
```

**std::move唯一的功能就是把左值强制转化为右值**，让右值引用可以指向左值。其实现等同于一个类型转换：`static_cast<T&&>(lvalue)`。 所以，**单纯的std::move()不会有性能提升**。

同样的，**右值引用**能指向右值，本质上，其实也是先把右值提升为一个左值，再定义一个右值引用通过std::move指向该左值：

```c++
int &&ref_a = 5; //左值temp作为中间体被省略
ref_a = 6; 
 
//等同于以下代码：
 
int temp = 5;
int &&ref_a = std::move(temp);
ref_a = 6;
```

#### 2.3.2 左值引用、右值引用本身是左值还是右值？

**被声明出来的左、右值引用都是左值**。因为被声明出的左右值引用是有地址的，也位于等号左边。

```C++
/ 形参是个右值引用
void change(int&& right_value) {
    right_value = 8;
}
 
int main() {
    int a = 5; // a是个左值
    int &ref_a_left = a; // ref_a_left是个左值引用
    int &&ref_a_right = std::move(a); // ref_a_right是个右值引用
 
    //验证他们全都是左值：
    change(a); // 编译不过，a是左值，change参数要求右值
    change(ref_a_left); // 编译不过，左值引用ref_a_left本身也是个左值
    change(ref_a_right); // 编译不过，右值引用ref_a_right本身也是个左值
     
    //std::move将左值转换成右值：
    change(std::move(a)); // 编译通过
    change(std::move(ref_a_right)); // 编译通过
    change(std::move(ref_a_left)); // 编译通过
 
    // 当然可以直接接右值，编译通过：
    change(5); 
     
    // 打印这三个左值的地址，都是一样的：
    cout << &a << ' ';
    cout << &ref_a_left << ' ';
    cout << &ref_a_right;
    
}
```

此外，**作为函数返回值的 && 是右值，直接声明出来的 && 是左值**。这细想也可以理解：无名的右值引用，作为一个单独的值（或者内容）而存在，没有地址，代表不了任何一片内存存储。而有名的右值引用，我们可以获得它的名字，从而用`&`获取到它所在的地址：这就进步了很多，至少获得了一个实实在在存在的内存供我们访问，也就有了作为左值的资格。

最后，从上述分析中我们得到如下结论：

1. **从性能上讲，左右值引用没有区别，传参使用左右值引用都可以避免拷贝。**
2. **从可以指向的类型来讲，右值引用可以直接指向右值，也可以通过std::move指向左值（本质还是指向了右值）；而左值引用只能指向左值(const左值引用也能指向右值)。**
3. **可以发现，作为函数形参时，右值引用更灵活。虽然const左值引用也可以做到左右值都接受，但它无法修改，有一定局限性，这也是右值引用出现作用场景的地方。**

## 3.右值引用和std::move的应用场景

### 3.1 实现移动语义

**实现移动语义，避免了拷贝，从而提升程序性能**。

在没有右值引用之前，一个简单的数组类通常实现如下，有`构造函数`、`拷贝构造函数`、`赋值运算符重载`、`析构函数`等。

```C++
class Array {
public:
    //默认构造函数
    Array(int size) : size_(size) {
        data_ = new int[size_];
    }
     
    // 深拷贝构造
    Array(const Array& temp_array) {
        size_ = temp_array.size_;
        data_ = new int[size_];
        for (int i = 0; i < size_; i ++) {
            data_[i] = temp_array.data_[i];
        }
    }
     
    // 深拷贝赋值
    Array& operator=(const Array& temp_array) {
        delete[] data_;
 
        size_ = temp_array.size_;
        data_ = new int[size_];
        for (int i = 0; i < size_; i ++) {
            data_[i] = temp_array.data_[i];
        }
    }
    
  //折构函数
    ~Array() {
        delete[] data_;
    }
 
public:
    int *data_;
    int size_;
};
```

该类的拷贝构造函数、赋值运算符重载函数已经通过使用左值引用传参来避免一次多余拷贝了，但是内部还是要实现深拷贝。

那么如果存在这种情况（这很普遍）：传进来的参数是个右值，原引用以后永远不会再使用了，这个时候我们如果直接让新的引用指向它不是更好吗？因为它以后再也不会被调用了，我们只是”废物利用“一下，而非去创建一片新的区域去根据它进行深拷贝后，把它直接释放掉。

解决方案可以提供一个可选择是否进行深拷贝的`移动构造函数`，即效果是二者指向同一个array：

```C++
class Array {
public:
    //默认构造函数
    Array(int size) : size_(size) {
        data_ = new int[size_];
    }
     
    // 深拷贝构造。照抄
    Array(const Array& temp_array) {
        ...
    }
     
    // 深拷贝赋值，照抄
    Array& operator=(const Array& temp_array) {
        ...
    }
 
    // *移动构造函数，可以通过第二个参数考虑要不要进行深拷贝
    Array(const Array& temp_array, bool move) {
        if (move) {
            data_ = temp_array.data_;
            size_ = temp_array.size_;
            // 为防止temp_array析构时delete data，提前置空其data_      
            temp_array.data_ = nullptr;
        }else {
            //执行深拷贝..
        }
    }
     
 
    ~Array() {
        delete [] data_;
    }
 
public:
    int *data_;
    int size_;
};
```

这样做有个问题：左值引用`temp_array`是个`const`修饰的变量，**无法被修改**，所以`temp_array.data_ = nullptr;`这行会编译不过。这就无法实现直接把原引用置空了。

**右值引用的出现解决了这个问题**：

```C++
class Array {
public:
    ......
 
    
    
    // 右值引用替代了原先的const左值引用来处理右值，从而实现了可以修改原引用所指向的东西。
    Array(Array&& temp_array) {
        data_ = temp_array.data_;
        size_ = temp_array.size_;
        // 为防止temp_array析构时delete data，提前置空其data_，此时可以做到了    
        temp_array.data_ = nullptr;
    }
     
 
public:
    int *data_;
    int size_;
};

int main(){
    Array a;
 
    // 做一些操作
    .....
     
    // 左值a不再使用了，用std::move转化为右值
    Array b(std::move(a));
}
```

此时参数为左值引用意味着拷贝，为右值意味着移动。

### 3.2 实例：vector::push_back使用std::move提高性能

```C++
int main() {
    std::string str1 = "aacasxs";
    std::vector<std::string> vec;
     
    vec.push_back(str1); // 传统方法，copy
    vec.push_back(std::move(str1)); // 调用移动语义的push_back方法，避免拷贝，str1会失去原有值，变成空字符串
    vec.emplace_back(std::move(str1)); // emplace_back效果相同，str1会失去原有值
    vec.emplace_back("axcsddcas"); // 当然可以直接接右值
}
 
// std::vector方法定义
void push_back (const value_type& val);
void push_back (value_type&& val);
 
void emplace_back (Args&&... args);
```

- 除非设计不允许移动，STL类大都支持移动语义函数，即`可移动的`.
- 编译器会**默认**在用户自定义的`class`和`struct`中生成移动语义函数.

 **因此，可移动对象在<需要拷贝且被拷贝者之后不再被需要>的场景，建议使用**`std::move`**触发移动语义，提升性能：**

```C++
moveable_objecta = moveable_objectb; 
改为： 
moveable_objecta = std::move(moveable_objectb);
```

## 4.完美转发 std::forward（了解即可）

```C++
//在标头 <utility> 定义
template< class T >
constexpr T&& forward( std::remove_reference_t<T>&& t );
```

 转发左值为左值或右值，依赖于 T。与move相比，forward更强大，move只能转出来右值，forward都可以。

> `std::forward<T>(u)`有两个参数：T与 u。
>
> a. 当T为左值引用类型时，u将被转换为T类型的左值；
>
> b. 否则u将被转换为T类型右值。

用法和解析如下：

```C++
void B(int&& ref_r) {
    ref_r = 1;
}
 
// A、B的入参是右值引用
// 有名字的右值引用是左值，因此ref_r是左值
void A(int&& ref_r) {
    B(ref_r);  // 错误，B的入参是右值引用，需要接右值，ref_r是左值，编译失败
     
    B(std::move(ref_r)); // ok，std::move把左值转为右值，编译通过
    B(std::forward<int>(ref_r));  // ok，std::forward的T是int类型，属于条件b，因此会把ref_r转为右值
}
 
int main() {
    int a = 5;
    A(std::move(a));
}
```

```C++
void change2(int&& ref_r) {
    ref_r = 1;
}
 
void change3(int& ref_l) {
    ref_l = 1;
}
 
// change的入参是右值引用
// 有名字的右值引用是 左值，因此ref_r是左值
void change(int&& ref_r) {
    change2(ref_r);  // 错误，change2的入参是右值引用，需要接右值，ref_r是左值，编译失败
     
    change2(std::move(ref_r)); // ok，std::move把左值转为右值，编译通过
    change2(std::forward<int &&>(ref_r));  // ok，std::forward的T是右值引用类型(int &&)，符合条件b，因此u(ref_r)会被转换为右值，编译通过
     
    change3(ref_r); // ok，change3的入参是左值引用，需要接左值，ref_r是左值，编译通过
    change3(std::forward<int &>(ref_r)); // ok，std::forward的T是左值引用类型(int &)，符合条件a，因此u(ref_r)会被转换为左值，编译通过
    // 可见，forward可以把值转换为左值或者右值
}
 
int main() {
    int a = 5;
    change(std::move(a));
}
```

上边的示例在日常编程中基本不会用到，`std::forward`最主要运于模版编程的**参数转发**中。
