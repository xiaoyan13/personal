# 组合式API基础

## 组合式和选项式

### 选项式

通过包含一些选项的一个对象，来描述整个组件的所有逻辑，常见的选项有`data`、`methods` 和 `mounted`。`data`选项中的属性会暴露到组件实例上，而函数的`this`指向的就是组件实例。

### 组合式

使用导入的接口函数来描述整个组件的所有逻辑。组合式的核心思想是直接在作用域内定义响应式状态变量，并将从多个函数中得到的状态组合起来处理复杂问题。

### 区别和联系

它们只是同一个底层系统（vue）所提供的两套不同的接口。实际上，选项式是在组合式的基础上实现的。选项式比较简单，而组合式和`ts`能更系统的构建出复杂项目。

## Setup写法

选项式的写法，在组合式中，是被放在一个叫做`setup`的选项中包裹。`setup`返回数据和方法，他们被暴露在组件中，供`template`使用：

```vue
<script>
import { reactive } from 'vue'

export default {
  setup() {
    const state = reactive({ count: 0 })

    function increment() {
      state.count++
    }
    return {
      state,
      increment
    }
  }
}
</script>
```

这种写法被简化为了`setup`语法糖：

```vue
<script setup>
import { reactive } from 'vue'

const state = reactive({ count: 0 })

function increment() {
  state.count++
}
</script>
```

定义的属性和函数会被自动的暴露出来，更推荐这种简单的写法。

### 数据更新时机

`watchEffect()`接收一个函数并**立即运行**，同时响应式地监听其内部的依赖，并在依赖数据发生更改时重新执行。

### DOM更新时机

DOM的更新并不是随着响应式数据的更改而同步发生变化的。

`vue`会缓存这些数据更新，直到某个数据不再改变的“时机”，以确保在所有数据全部更改完毕后，才触发仅一次的`DOM`更新。也就是说，即使一次操作中更改了大量的内置数据，每个`DOM`都只在最后被更新了一次。

`nextTick`全局函数接口可以介入`dom`更新的时间点，进行一些操作。它是一个异步函数，在被调用后，它将监听并等待 DOM 更新完成，在执行传入的回调：

```js
function nextTick(() => void): Promise<void>
```

## ref与reactive

`reactive()`返回一个对象的响应式代理。

### 区别

## 模板引用

特殊属性的`ref`可以引用元素：

```vue
<script setup>
import { ref, onMounted } from 'vue'

// 声明一个 ref 来存放该元素的引用
// 必须和模板里的 ref 同名
const input = ref(null)

onMounted(() => {
  input.value.focus()
})
</script>

<template>
  <input ref="input" />
</template>
```

### 引用自定义组件

对于自定义组件，在选项式中，组件不是代理的，这个时候通过`this.$refs`获取到的模板引用就是这个实例本身。而如果一个子组件被声明为了`script setup`，因为此时父组件获取到的就不再是实例的了，而是组件实例的代理：

```js
onMounted(() => { // 选项式为 Mounted() : {...}
  console.log(child);// 选项式为 console.log(this.$refs.child)
})
```

输出：

- 父组件用组合式 子组件用组合式： `Ref<Proxy(Object)>`
- 父组件用组合式 子组件用选项式： `Ref<VueInstance>`
- 父组件用选项式 子组件用组合式： `Proxy(Object)`
- 父组件用选项式 子组件用选项式： `VueInstance`

并且，子组件默认暴露数据的行为也会发生变化，父组件无法访问到一个使用了 `<script setup>` 的子组件中的任何东西，除非子组件在其中通过 `defineExpose` 显式暴露。

## Computed

选项式`api`:

```js
const data = computed(() => {...})
```

`computed()` 方法期望接收一个 getter 函数，返回值为一个**计算属性**的`ref`。`vue`会自动的收集这个`getter`函数中用到的所有响应式数据，并监听他们的变化，在他们变化的时候更新计算属性。

这个计算属性也是只读的，所以用了`const`。可以同时提供`getter`和`setter`，从而可写。

## Props

### defineProps

`defineProps`用于在`script setup`中定义`props`，传递给 `defineProps()` 的参数，和提供给 `props` 选项的值是相同的，可以是字符串数组，也可以传递对象：

```vue
<script setup>
const props = defineProps(['foo'])
</script>

<script setup>
defineProps({
  title: String,
  likes: Number
})
</script>
```

对象形式的 props 声明，不仅可以一定程度上作为组件的文档，而且如果其他开发者在使用你的组件时传递了错误的类型，也会在浏览器控制台中抛出警告。这被称为“props的校验”，指的就是对象形式的 props 。

在选项式中，prop使用 props 来声明，而`setup`可以接收`props`：

```js
export default {
  props: ['foo'],
  setup(props) {
    // setup() 接收 props 作为第一个参数
    console.log(props.foo)
    return {}
  }
}
```

### 单向数据流

想要利用并且修改`props`：

- **子组件想在之后将其作为一个局部数据属性**，应该使用`ref`新定义一个局部数据属性：

```js
const props = defineProps(['initialCounter'])

// 计数器只是将 props.initialCounter 作为初始值
// 像下面这样做就使 prop 和后续更新无关了
const counter = ref(props.initialCounter)
```

- **需要对传入的 prop 值做进一步的转换**，应该使用`computed`。

同样的，对于`js`对象引用的特性，子组件是可以做到修改父组件的值的，这是单向数据流的[特殊情形](https://cn.vuejs.org/guide/components/props.html#one-way-data-flow)。

## emits

### defineEmits

组件通过 `defineEmits()`来声明它要触发的事件，它必须直接放置在 `<script setup>` 的顶级作用域下。与`props`类似的，它的参数也可以是一个对象，用于校验：

```vue
<script setup>
defineEmits(['inFocus', 'submit'])
</script>

<script setup>
const emit = defineEmits({
  submit(payload) {
    // 通过返回值为 `true` 还是为 `false` 来判断
    // 验证是否通过
  }
})
</script>
```

`this.$emit` 方法不能在组件的 `<script setup>` 部分中使用，`setup`中`this=undefined`。(`this`未指向当前的组件实例，在`setup`被调用之前，`data`，`methods`, `computed`等都没有被解析，但是组件实例确实在执行`setup`函数之前就已经被创建好,但是并未绑定`this`。`new Vue()`创建`vue`实例后应该进入`beforeCreate`生命周期，但是`setup`的执行时机是在`beforeCreate`之前的，此时`this`是`undefined`.）

 `defineEmits()` 会返回一个相同作用的函数供我们使用。

而在选项式中，emit通过 emits 来声明，而`setup`函数可以接收一个上下文对象，`emit` 函数被暴露在里面，所以可以使用它：

```js
export default {
  emits: ['inFocus', 'submit'],
  setup(props, ctx) {
    ctx.emit('submit')
  }
}
```

## 异步依赖

可以在`onMounted`的时候进行数据请求，从而在数据请求之后操作`dom`。

也可以在创建实例前或者创建实例后去进行数据请求。但在`Composition-API`中，没有`beforeCreate`、`created`,相对应的数据初始化的操作可以在直接写在`setup()`中。`setup`的执行时机在`beforeCreate`之前。当一个`setup()`选项或者`script setup`的顶层包含了`await`的时候，该组件将自动成为一个**异步依赖**，它**必须**被`<Suspense>`标签包围，以控制其意为“悬空/挂起”。该组件的加载状态将由 `<Suspense>` 控制，而该组件自己的加载、报错、延时和超时等选项，都将被忽略。

```vue
<Suspense>
  <!-- 具有异步依赖的组件 -->
  <Dashboard />

  <!-- 在 #fallback 插槽中显示 “正在加载中” -->
  <template #fallback>
    Loading...
  </template>
</Suspense>
```

在初始渲染时，`<Suspense>` 将在内存中渲染其默认的插槽内容。如果在这个过程中遇到异步依赖，则会进入**挂起**状态。如果没有遇到异步依赖，`<Suspense>` 会直接进入完成状态。进入完成状态后，只有当默认插槽的根节点被替换时，`<Suspense>` 才会回到挂起状态。组件树中新的更深层次的异步依赖**不会**造成 `<Suspense>` 回退到挂起状态。
