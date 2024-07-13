## TS类型推导

直觉上，ts 的类型实现是更加偏工程的东西，很多特性是**以需求为目的导向**的，有很多为了需求而造出来的类型特性。

ts 是基于字面和词法分析的。通过实际代码时书写，将内容划分为字面量的类型和变量类型两类对待。

## 字面量

### 初始类型设定

当一个字面量被输入到文件内容中（初次书写）的时候，按照逻辑它应该是硬编码的字面量类型，但是毕竟 ts 是以需求为基础的，所以它会被自动放大到合适的父类型(`Best common type`)：

```ts
"hello"; // string
"hello" as "hello"; // "hello" (字面量类型)
```

### 类型变化

- 无法变化

## 变量

### 初始类型设定

当一个变量被初次书写，它会被尝试推断类型，如果推断不出，它的初始设定就是隐式的 `any`，即不进行任何类型检查，变量退化为原始的 `js`，变量的类型将永远不会再变化，即永远保持 `any` 状态：

```ts
let x; // x 具有隐式的 any
x = 123; // hover x: any
```

但是如果在变量能够推断出非 `any` 类型，情况就会不同：

```ts
let x = Math.random() < 0.5 ? 10 : "hello world!"; // hover x: string | number
x; // x: string | number
x = 1; // hover x: number
```

一旦一个变量类型不再是 `any`，那么它的类型将可以被影响和并收窄。

### 类型变化

这里需要明确，一旦一个变量开启了类型检查（即不再是隐式的 `any`），那么它的类型就不会再改变了，变化只能发生**收窄**(narrowing)。

类型收窄也只是因为 ts 推断出了更精确的类型：

- 用户显式告知，即 `:type`。他的优先级最高，他出现意味着放弃任何其他分析。要求此 `type` 必须是一个准确的类型（即非泛型）。

- 控制流分析
  - statement `if、switch` with keyword `typeof、instanceof` / operator `in` / function predicate `is`
  - `assert` (ensures that whatever expression pointed must be TRUE for the remainder of the containing scope.)
-  `=` 、 `==` 、`===`

### 类型交互检查

#### `freshness` 与 `duck type`

字面量的类型，和变量类型的交互是严格的，被称为 `ts freshness`：

```ts
interface A {
    a: number
}
const myVar = { a: 1, b: 2 }
const a1: A = myVar; // 通过类型检查
const a2: A = { a: 1, b: 2 } // error: 对象字面量只能指定已知属性
```

也就是说，”鸭子类型“,即只要符合结构就可以相互交互赋值，只适用于变量之间的类型交互。对于变量和字面量的类型的交互，必须要解构严格相等才行，不能有多余的属性。

#### Non-nullish value

`ts` 中，有一个特殊的类型：

```typescript
interface All {}
```

[stackoverflow](https://stackoverflow.com/questions/49464634/difference-between-object-and-object-in-typescript) 的一篇文章对此有非常清楚的解释。它并不代表一个“没有任何属性的对象”的类型。而代表任何 `ts` 类型。

当 `undefined` 和 `null` 是任意类型的子集（即 [`strictNullChecks`](https://www.typescriptlang.org/tsconfig/#strictNullChecks) 选项关闭的时候），`{}` 代表任何类型；当此选项开启的时候，他们不再是任何类型的子集，作为独立的类型集合划分而存在，`{}` 代表除了这两个类型之外的任何类型。

`{}` 类型的变量，没有作为变量的类型声明的价值，因为他代表任何类型，也就不能得到任何具体的类型提示：

```typescript
let num: {} = 1
num++; // error!!!
```

它主要用于 `ts` 类型集合运算。

#### 函数类型交互

在 `C++` 设计中，函数指针的参数类型和返回值类型必须完全匹配。这意味着函数指针不能使用父子类型关系来进行赋值。`ts` 考虑到函数赋值在 ` js` 中一种相对常见的行为，所以允许了这种赋值。但是这种赋值的设计，似乎违背类型运算：

```ts
interface T { }
interface TChild extends T {
    a: number
}

// 正常情况下，我们认为，只能子类型赋值给父类型，父类型无法兼容子类型
let a: T = {}
let b: TChild = { a: 1 }
a = b;
b = a; // error：不能将类型“T”分配给类型“TChild”
// 对于函数的返回值类型，也合情合理的满足这一点：
let myf0: () => T = (): TChild => { return { a: 1 } }

// 但是对于函数参数，这恰好是反过来的，父类型可以赋值给子类型，反过来却不可以：
let myf1: (a: TChild) => void = (a: T): void => { }
let myf2: (a: T) => void = (a: TChild): void => { } // error：不能将类型“T”分配给类型“TChild”

// 这一反常, 同样适用于函数参数的多少：
let myf3: (a: number) => void = (): void => { } // 可以少参数
let myf4: () => void = (a: number): void => { } // error
```

ts 认为，考虑到需求和实用性，对于函数作为参数，传入的实际函数的类型越宽泛，反而越好。一个典型的例子：

```ts
function forEach(arr: any[], callback: (item: any, index: number, array: any[]) => void);
```

在实际使用的时候，我们传入的 `callback` 往往都是更加广泛的类型，即不写后面用不到的参数 `index`, `array`。这也说明，对于 ts 而言，工程设计优先于哲学。

#### T类型推导

从功能上看，泛型可以作用于任何一个有类型标注的数据结构：对象的方法、函数、类、接口等，从中抽离出类型。泛型是一个类型退化行为，但并未完全退化，它仍然约束多个变量之间的联系。

泛型本身是用于从分离数据结构和类型的，但是在 `ts` 中，一些数据结构本身就可以作为类型使用，比如类、接口，所以在 `ts` 里这样说或许不太恰当。根据泛型作用的目标，分为两种：


- 泛型函数类型：这包括了泛型函数和泛型类。类本质上是构造函数；对象的方法也是函数。
- 泛型接口类型。

加上泛型 `T`（的数据结构或者说是类型），产生了新的类型交互，即**T类型推导**：根据传入的变量推导 `T`。`ts` 只有函数支持类型推导，而泛型接口不支持这个功能：

```ts
interface A<T> {
    a: T
}
let a: A<number> = { a: 1 } // A<number> 是一个准确的类型
let b: A = { a: 1 } // error: 泛型 A 必须显示明确参数类型
```

这个问题在 `github` 上有数个相关 `issue`，并且属于长期未被解决的问题。`ts` 对于泛型推导做的不是很好。

想要实现泛型接口的类型推导，就只能依赖一个泛型函数：

```ts
// 类型推导可以通过中间函数实现
let transferTypeToA: <T>(data: A<T>) => A<T> = (data) => data
let c = transferTypeToA({ a: 1 }) // hover c: A<number>
// 或者直接断言，但这将丧失类型检查
let d = <A<number>>{ a: 1 }
```

## 类型运算

### 概述

虽然自然情况下只能发生类型收窄，但可以通过类型运算来得到想要的类型。

- 强制指定类型： `as`，`<>`。这也将关闭对指定变量的类型检查。
- 类型运算符。类型运算符两侧为值或类型。产出类型。
  - `keyof` / `typeof` / `in`
  - `intersection` / `union`
  -  `satisfies`
  - `indexed Access types` / `Conditional Types` / `Mapped Types`
  - `template literal types`
  - ...

### 工具类型

```typescript
type Awaited<T extends Promise<U>> = U // 提取 Promise 返回结果.

type Partial<T> = { [K in keyof T]: T[K] }
```
