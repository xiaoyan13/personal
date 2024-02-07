# prop与emit

`prop`和`emit`是`vue`组件十分重要的点，因为它们是**组件之间信息传递的手段**。

## props的概念

- 数组Props

最基本的行为是，子组件通过一个数组定义期望的接收值，父组件通过属性名传递数据。这个数组就叫做`props`。

在组件标签上定义的属性，如果在`props`数组中被定义，则放进`props`中，这些 `props` 会暴露到 `this` 上；如果没有，则放在该组件的根标签上（这种行为可以通过`inheriAttrs`关键字关闭）；如果根标签也没有，则只放在`$attrs`中。而`$attrs`中的属性变量可以通过`v-bind`再绑定到想要绑定的标签上。这类操作情景经常会发生。

- 对象Props

子组件定义的props键对应的值也可以是一个对象，用于更进一步的限制期望的接受值，如限制数据类型（本质是传入*构造函数*）、设置默认值`default`、验证器`validator`等，更多参数查阅参见官方文档。

值得注意的一点是，如果传递的是**数组**或者**对象**类型的**引用型**数据，则默认值应当写成**函数返回值**的形式，如果直接写就是传引用了，所有组件公用一个数据，就不对了。

## 传递的数据

### 数据的类型

任何类型的数据都可以被当作`props`期望的数据来传递，有两种特殊的情况分别是*布尔值*和*方法*。

- 作为`boolean`传递的时候，默认为`ture`，所以可以把`true`省略，这意味我们可以不用`v-on`绑定语法去书写表达式得到变量真值：

```vue
<!-- 仅写上 prop 但不传值，会隐式转换为 `true` -->
<BlogPost is-published />

<!-- 等价于： -->
<BlogPost :is-published="true" />

<!-- 而不是字符串： -->
<BlogPost is-published="true" />
```

- 传递一个父组件的*方法*的时候，该方法在子组件中**同样生效**，即使它使用了`this`（挖个坑，以后了解原理）：

```vue
<script>
// 父组件
import TestComponent from './components/TestComponent.vue';
export default {
  components: {
    TestComponent
  },
  data() {
    return {
      name: 'xiaoyan'
    }
  },
  methods: {
    fatherFunc() {
      this.name += '233'
      console.log(this);
    }
  },
}
</script>

<template>
  {{ name }}
  <TestComponent :func="fatherFunc"></TestComponent>
</template>
```

```vue
<template>
    <button @click="func2">子组件按钮</button>
</template>
 
<script>
// 子组件
export default {
    props: ['func'],
    data() {
        return {
            name2: 'testComponent'
        }
    },
    methods: {
        func2() {
            console.log(this)
            this.func();
        }
    }
}
</script>
```

### 特殊的引用类型数据

”单向数据流“：子组件无法通过`props`来修改父组件的原值，但是父组件原值的修改会传递到子组件。

对于对象这种“嵌套”引用类型的数据，”单向数据流“是不起作用的，这是因为`vue`只去检测最外层是否被修改，而不去递归的判断内层。

当对象或数组作为 props 被传入时，虽然子组件无法更改 props 绑定，但仍然**可以**更改对象或数组内部的值。 js的对象和数组是按引用传递，递归检测内部的改动有很大的性能损耗，所以`Vue`没有限制这个特性。

这个特性可以用在**子组件想要更改父组件中的对象**的时候。因为它允许了`props`被修改：“单向数据流”特性的特例。当然，也可以通过`v-model`双向数据绑定，或者`emit`事件传值给父组件并更改原值两种方式做到。

### `props`单向数据流

`props`被建议写成HTML风格：

> 对于组件名我们推荐使用 [PascalCase](https://cn.vuejs.org/guide/components/registration.html#component-name-casing)，因为这提高了模板的可读性，能帮助我们区分 Vue 组件和原生 HTML 元素。然而对于传递 props 来说，使用 camelCase 并没有太多优势，因此我们推荐更贴近 HTML 的书写风格。

## props批量传递数据

可以使用不带参数的`v-bind`来绑定一个对象，对象中的所有属性将被传递给`props`。

```vue
<script>
export default {
  data() {
    return {
      post: {
        id: 1,
        title: 'My Journey with Vue'
      }
    }
  }
}
</script>

<template>

<BlogPost v-bind="post" />

</template>
```

默认情况下所有的属性（不管加不加`:`）都会被传递给子组件的根标签上。`props`相当于抽取了一部分属性作为自己的`property`，可以在组件中使用他们，`emits`也抽取了另一部分特殊的事件属性，最后剩余的`$attrs`被称作`透传属性`。

`v-bind`绑定+`inheritAttrs: false`可以改变传递到根标签的默认行为，但是也只能整体的转移到另一个标签上：

```vue
<template>
<div>
  <div v-bind="$attrs"></div>    
</div>
</template>
<script>
export default {
    inheritAttrs: false,
    data() {
        return {
            ...
        }
    }
}
</script>
```

## emit

`emits` 选项对`事件属性`做了特殊处理。它会影响一个属性被解析为*组件事件的监听器*，还是*原生 DOM 事件的监听器*。

具体来讲，被声明为组件事件的监听器属性（即在`emits`中声明）**不会**被传到组件的根元素上，且将从组件的 `$attrs` 对象中**移除**。取而代之的，这个被移除的函数属性可以使用方法 `$emit` 手动触发：

```vue
<!-- 父组件 -->
<MyComponent @submit="callback" />
```

```js
<!-- MyComponent -->
export default {
  emits: ['inFocus', 'submit'],
  methods: {
    submit() {
      this.$emit('submit') // callback()
    }
  }
}
```

而不在`emits`中声明的事件属性则会被视为原生`dom`的监听器，如`@click`不在`emit`中被接收。事实上，我们也不应该接收`click`属性，它本来开就是属于原生的，我们接收它会很容易与原生的`click`混淆，所以`vue`会抛出一个警告：

```vue
<script>
export default {
    emits: ['click']
}
</script>

<template>
<button @click="click">点我通过原生click来触发自定义click事件</button>
</template>
```

`emits`除了是个数组，还可以是一个对象，这和`props`接收数据同理，是为了进一步限制接收事件的类型等。

### $emits方法

`$emits`可以附带参数，表示传入函数的参数：

```vue
<button @click="$emit('increaseBy', 1)">
  Increase by 1
</button>
```

这个方法有一个细节就是，它实现了*父组件中的函数使用子组件的数据*。当然，我们也可以通过`props`来接收父组件中的一个函数方法，然后在子组件中调用它，也可以实现相同的效果。
