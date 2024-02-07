# Vue的基本使用

## 基本指令

`vue`能够对挂载后的元素全面的控制，所以我们可以在该元素中很方便的使用一些指令，这些指令能够被Vue识别和解析翻译。

- `v-html`

  能够把文本通过html进行解析。很危险的用法，为了避免`xss`攻击，尽量少用。

  直接作为HTML，忽略解析数据绑定。

  不能使用 `v-html` 来复合局部模板，因为`vue`不是基于字符串的模板引擎。

- `v-text`

  更新元素的 `textContent`。

- `v-once`

  通过使用`v-once`指令，能执行一次性地插值，当数据改变时，插值处的内容不会更新。

  留心这会影响到该节点上的其它数据绑定。

- `v-bind:[arg]="value"`/`:`

  属性绑定。`arg`最终被解析为`dom`的一个属性名。`value`可以是响应式的`data`。

- `v-on:event.Modifier="func"`/`@`

  **事件绑定**。用于把一个元素绑定某个事件函数。`.`后面可以跟修饰符。事件触发后调用`func`。

  绑定的值可以是内联 `js`语句 ，或者一个组件上定义的方法（默认会传入一个参数`e`表示事件，也可以通过`$event`显式的传入和接收）。在原生事件中，`$event`是事件对象，在自定义事件中，`$event`是传递过来的数据（参数）。

- `v-if`、`v-show`

  二者都是在满足一定条件（`js`表达式结果为真）的时候渲染出所在的元素。

  区别在于，`v-if` 也是**惰性的**：如果在初始渲染时条件为假，则什么也不做，直到条件第一次变为真时，才会开始渲染条件块。而`v-show` 不管初始条件是什么，元素总是会被渲染，并且只是简单地基于`CSS`进行切换。所以，一般来说，`v-if` 有更高的切换开销，而 `v-show` 有更高的初始渲染开销。

  此外，`template`组件支持`v-if`和`v-else`，表示流程控制。

- `v-for`

  渲染一个列表。`v-for`不能和`v-if`混用，因为`v-if`的优先级大于`v-for`（在Vue3中）。
  
  `v-for`可以遍历数值、数组、对象。
  
  具体用法参见文档。
  
- `v-model`

  用于用于将表单输入框的内容同步给 `js` 中相应的变量。它本质是一个语法糖。
  
  在被写在了原生标签上的时候，`vue`将会把它展开为：
  
  ```vue
  <input
    :value="text"
    @input="event => text = event.target.value">
  <!--  等价于  -->
  <input v-model="text">
  ```
  
  在被放在`vue`的组件上的时候，`vue`则把它展开为：
  
  ```vue
  <CustomInput
    :modelValue="searchText"
    @update:modelValue="newValue => searchText = newValue"
  />
  
  <!--  等价于  -->
  <CustomInput v-model:modelValue="searchText"></CustomInput>
  
  <!--  最终等价于  -->
  <CustomInput v-model="searchText"></CustomInput>
  ```
  
  要让这个例子实际工作起来，`<CustomInput>` 组件内部需要做两件事：
  
  1. 将内部原生 `<input>` 元素的 `value` attribute 绑定到 `modelValue` prop
  2. 当原生的 `input` 事件触发时，触发一个携带了新值的 `update:modelValue` 自定义事件，这个叫做`update:modelValue`的`emit`应该在父组件中被定义过，可以是内联的，也可以是一个具体的方法。
  
  也就是说，这里约定了组件内部实际的代码。接收的`prop`必须叫做`xxx`，那么`emit`必须叫做`update:xxx`。此时我们用的时候需要写成：
  
  ```vue
  <CustomInput v-model:xxx="searchText"></CustomInput>
  ```
  
  特别的，如果`prop`的名字叫做`modelValue`，那么它可以被省略书写，`vue`会自动的添加：
  
  ```vue
  <CustomInput v-model="searchText"></CustomInput>
  ```

## 计算属性

```vue
<script>
export default {
  data() {
    return {
        ...
    }
  },
  computed: {
      ...
  }
}
</script>
```

### 低耦合

在实际的页面逻辑处理的时候，我们总希望用户导致某一个数据`A`变化后，另一个数据`B`响应式的随`A`变化。

如果我们在对数据`A`的变化处理函数中，在结尾处加入对数据`B`的逻辑判断，来实现响应式，这就会**污染**数据`A`的处理函数，函数应当是**低耦合**的。在**回调地狱**中可以发现类似的情况。我们总是**在结尾处去处理完成这件事后需要做的逻辑**，但这件事情本身不属于之前事务的一部分。这种方式连锁产生了多层嵌套。

**计算属性Computed**中声明的属性，会依附**响应式**数据的变化而变化。这就划掉了我们不得不在函数结尾处去判断其他关联数据的代码。

推荐使用**计算属性**来描述依赖响应式状态的逻辑。

### 属性缓存的优点

使用计算属性的另一个优点在于，它被缓存。和每次都在函数结尾处去判断其他关联数据的代码相比，一个计算属性仅会在其响应式依赖更新时才重新计算，这在渲染和动态更改大数组的时候会减少开销。

### setter

计算属性默认是**只读**的。当你尝试修改一个计算属性时，会收到一个运行时警告。如果需要直接更改属性的值，可以通过同时提供 `getter` 和 `setter` 来创建：

```js
export default {
  data() {
    return {
      firstName: 'John',
      lastName: 'Doe'
    }
  },
  computed: {
    fullName: {
      // getter
      get() {
        return this.firstName + ' ' + this.lastName
      },
      // setter
      set(newValue) {
        [this.firstName, this.lastName] = newValue.split(' ')
      }
    }
  }
}
```

## 侦听器

Vue 通过 `watch` 选项提供了一个更通用的方法，来响应数据的变化。它多了一个参数。

```js
watch: {
    // 如果值发生改变，这个函数就会运行
    valName: function (newValue, oldValue) {
    ...
    }
},
```

使用 `watch` 选项允许我们执行**异步操作** (访问一个 API)，从而限制我们执行该操作的频率；并在我们得到最终结果前，设置中间状态。这些是计算属性无法做到的。
