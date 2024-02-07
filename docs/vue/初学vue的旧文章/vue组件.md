# vue组件

vue组件是一个知识点很多的点。本文总结了vue组件的交互以及各种特性。

介于vue3选用组合式API较新，而且选项式API可能大体思路比较简单，所以下文将主要使用组合式API。

## 概念

一个组件就是一个`.vue`文件。

## 两种注册方式

要想在别的地方使用组件，就需要去引入。在使用文件中直接import的方式称为局部注册，而使用`app.component()`方法，可以让组件在当前 Vue 应用中全局可用。全局注册虽然方便，但可能会有一些弊端，最明显的就是命名混乱（依赖关系变得不明确）。所以，更推荐的是局部引入的方式来使用组件。

局部注册除了都需要import外，在选项式API中，还需要使用 `components` 选项来引入。

## 组件交互

### 父传子：props

父组件中引用子组件的时候，通过自定义attribute+v-on数据绑定+子组件中接收props来实现。常用的props的对象的属性有type（类型），default（默认值），required（是否为必传）。

```ts
const props = defineProps({
    对象1:{
        type:...,
        default:...,
        require:...
    },
})

or

const props = defineProps<{
    name:type, 
}>() //script setup API with TS
```

被接收的对象可以直接使用，也可以用`props.对象`的形式使用。选用后者的理由可能是代码结构会更加清晰一点。

 这种数据共享是单向数据绑定。即对子元素的修改不会造成父组件的更新，而父组件的修改会影响子组件的数据。

> 所有的 props 都遵循着**单向绑定**原则，props 因父组件的更新而变化，自然地将新的状态向下流往子组件，而不会逆向传递。这避免了子组件意外修改父组件的状态的情况，不然应用的数据流将很容易变得混乱而难以理解。

这意味着你**不应该**在子组件中去更改一个 prop。若你这么做了，Vue 会在控制台上向你抛出警告。

### 进一步：插槽

在某些场景中，我们可能想要为子组件传递一些模板片段而非数据。子组件在它们的组件中渲染这些片段。这尤其在手机端开发非常有用。

这个时候，我们可以使用在子组件中定义`slot`标签。在父组件想要用子组件的时候，必须在引入子组件标签后，在标签内部写入要插入的内容。

#### 渲染作用域

插槽中使用变量显然会引起作用域的困惑。事实上，由于插槽本身内容来自父组件，所以里面的变量是在父组件的作用域中，而非子组件。插槽内容**无法访问**子组件的数据。这很合理。

#### 默认内容

在外部没有提供任何内容的情况下，可以为插槽指定默认内容。把默认内容写在`slot`标签里面即可。如果在使用子组件的时候传入了模板，将按照该模板来渲染，slot插槽里的默认内容被忽略；否则将按照默认内容渲染。

#### 具名插槽

有时在一个组件中包含多个插槽出口是很有用的。举例来说，在一个 `<BaseLayout>` 组件中，有如下模板：

```tsx
<div class="container">
  <header>
    <!-- 标题内容 -->
  </header>
  <main>
    <!-- 主要内容 -->
  </main>
  <footer>
    <!-- 底部内容 -->
  </footer>
</div>
```

对于这种场景，`<slot>` 元素可以有一个特殊的 attribute `name`，用来给各个插槽分配唯一的 ID，以确定每一处要渲染的内容：

```tsx
<div class="container">
  <header>
    <slot name="header"></slot>
  </header>
  <main>
    <slot></slot>
  </main>
  <footer>
    <slot name="footer"></slot>
  </footer>
</div>
```

这类带 `name` 的插槽被称为具名插槽 (named slots)。没有提供 `name` 的 `<slot>` 出口会隐式地命名为“default”。

要为具名插槽传入内容，我们需要使用一个含 `v-slot` 指令的 `<template>` 元素，并将目标插槽的名字传给该指令：

```tsx
<BaseLayout>
  <template v-slot:header>
    <!-- header 插槽的内容放这里 -->
  </template>
</BaseLayout>
```

`v-slot` 有对应的简写 `#`，因此 `<template v-slot:header>` 可以简写为 `<template #header>`。其意思就是“将这部分模板片段传入子组件的 header 插槽中”。

此外，对于`v-slot`属性，其值可以是变量。这在官方文档中被称为“动态插槽名”。一般来说，我们把它设置成字符串。

#### 进阶：作用域插槽传值

某些场景下插槽的内容可能想要同时使用父组件域内和子组件域内的数据。

我们确实有办法实现，那就是父组件v-slot+插槽v-on绑定属性（这中方式被称为插槽prop）。

这和父组件传值给子组件看起来很类似：父组件调用子组件标签，顺便通过v-on绑定来传递数据，子组件通过定义props字段来接收；而插槽绑定数据，父组件使用插槽的时候就可以拿到该插槽props，使用v-slot来接收。

对于匿名插槽：

```tsx
<!-- <MyComponent> 的模板 -->
<div>
  <slot :text="greetingMessage" :count="1"></slot>
</div>

<!-- 调用MyComponent  -->
<MyComponent v-slot="slotProps">
  {{ slotProps.text }} {{ slotProps.count }}
</MyComponent>
```

对于具名插槽，也是类似的，只需在后面加上`:name`即可：

```tsx
<!-- <MyComponent> 的模板 -->
<slot name="header" message="hello"></slot>

<!-- 调用MyComponent  -->
<MyComponent>
  <template #header="headerProps">
    {{ headerProps }} //{ message: 'hello' }
  </template>

  <template #default="defaultProps">
    {{ defaultProps }}
  </template>

  <template #footer="footerProps">
    {{ footerProps }}
  </template>
</MyComponent>
```

注意插槽上的 `name` 是一个 Vue 特别保留的 attribute，不会作为 props 传递给插槽。因此最终 `headerProps` 的结果是 `{ message: 'hello' }`。

此外，如果混用了具名插槽与默认插槽，则需要为默认插槽使用显式的 `<template>` 标签。尝试直接为组件添加 `v-slot` 指令将导致编译错误。这是为了避免因默认插槽的 props 的作用域而困惑。

关于插槽传值的底层原理我还是没有搞明白，日后研究原理时再深究吧，现在会用就行。

### defineExpose()：暴露组件

使用 `<script setup>` 的组件是**默认关闭**的。即通过模板引用或者 `$parent` 链获取到的组件的公开实例，**不会**暴露任何在子组件`<script setup>` 中声明的绑定。

可以通过 `defineExpose` 编译器宏来显式指定组件中要暴露出去的属性。此时父组件再用子组件，获取到的子组件实例将包含暴露的属性。

那么如何获取暴露的属性呢？我们知道Ref实际上是可以去获取DOM的属性的。

```tsx
//父组件
<div class='parent'>
    <child ref="getChildData"></child> //子组件
</div>

<script setup>
  import { ref } from 'vue'
    // 文档说setup写在script上组件是关闭的
    // 也就是说父组件使用getChildData.xxx访问不到子组件的数据
    // 此时我们需要用defineExpose把需要传递的数据暴露出去，这样外部才能访问到
    // 同理也可以接收外部传来的值

const getChildData = ref<InstanceType<typeof getChildData>>()
const obj = {
    name: 'celina',
    desc: '大笨蛋',
    age: 18
}

//给子组件传递数据
getChildData.value.getData() = obj

//获取子组件的data数据，什么时候获取根据自己业务来
const a = getChildData.value.updata()

</script>


//子组件
<div class="child"></div>

<script>
import { ref, defineExpose } from 'vue'

const data = ref(null)

defineExpose({
    getData(res){
        data.value = res //父组件传递来的值赋值给data
        `此时的data变成了
            {
            name: 'celina',
            desc: '大笨蛋',
            age: 18
            }
           `
    },
    updata(){
        return data.value //暴露出去父组件可以拿到data的数据
    }
})
  
</script>
```

#### 案例

在ElementUI中可以看到大量的defineExpose()。我们使用者可以很方便的对这些组件进行操控，就是因为这些组件对外暴露自己的很多方法。

### 事件

在组件的模板表达式中，可以直接使用 `$emit` 方法触发自定义事件：

```tsx
<button @click="$emit('someEvent')">click me</button>
```

既然插槽可以传值给父组件，那么普通的非插槽组件如何传值给父组件呢？事件可以做到。这也是事件的“顺带“用途，子组件向父组件传值。

----代补

## 依赖注入

前面大体总结了一对父子组件的交互。本节对多层嵌套的组件交互进行讨论。

### Prop透传问题

在面对多层组件嵌套，如果仅使用 props 则必须将其沿着组件链逐级传递下去，这会非常麻烦。vue提供了`provide` 和 `inject` 帮助我们解决这一问题。

### provide提供/Inject注入

`provide()` 函数接收两个参数。第一个参数被称为**注入名**，可以是一个字符串或是一个 `Symbol`。后代组件会用注入名来查找期望注入的值。一个组件可以多次调用 `provide()`，使用不同的注入名，注入不同的依赖值。

```tsx
<script setup>
import { provide } from 'vue'

provide(/* 注入名 */ 'message', /* 值 */ 'hello!')
</script>
```

要注入上层组件提供的数据，需使用 `inject()` 函数：

```tsx
<script setup>
import { inject } from 'vue'

const message = inject('message')
</script>
```

这种数据绑定是可以是响应式的。如果提供的值是一个 ref，注入进来的会是该 ref 对象，而**不会**自动解包为其内部的值。这使得注入方组件能够通过 ref 对象保持了和供给方的响应性链接。

## 递归组件

比如菜单列表，目录等组件都会采用递归。vue提供了一种嵌套for循环中放入同名组件的方式，允许自动的进行递归。

需要注意的是，这种递归具有冒泡特性，所以一般需要提供`stop`修饰符进行阻止冒泡。

## 动态组件

所谓动态组件，其实就是让多个组件使用同一个挂载点，并动态的切换。这在单页面内用的数不胜数了，所以vue提供了一个内置的组件用于简化这种动态切换操作。试想，如果要手写的话，怕是要写很多v-if标签，或者采用路由的形式，也是可以的。

### 动态组件和插槽的对比

动态组件旨在让一个挂载点对应多个组件，通过用户的Tab切换来实现灵活的切换页面（本质上是切换了页面的一部分）。而插槽则是一个挂载点对应一个组件，只不过该组合的内容可以自定义。插槽旨在对于某一特定的区域进行内容的更新，它也可以做到页面的更新。

二者效果类似，但原理不同。插槽更为小巧，注重单个组件的内容变化；而动态组件更为重量级 ，通过更换不同组件实现内容的切换。
