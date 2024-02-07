# 插槽

## 基本使用

使用`slot`来定义一个插槽：

```vue
<slot name="default">
<!-- default content -->
</slot>
```

插槽有一个特殊的属性`name`，代表插槽名，默认值为`default`。

插槽可以定义默认内容，在外部没有提供任何内容的情况下，这些内容会被渲染，否则不会。

使用的时候，组件内部包裹的内容默认插入该插槽中，除非使用`v-slot`指令指定哪个插槽：

```vue
<!-- BaseLayout -->
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

```vue
<!-- 父组件中使用 -->
<BaseLayout>
  <template v-slot:header>
     <!-- header 插槽的内容放这里 -->
  </template>

  <template v-slot:default>
    <!-- 其余内容放这里 -->
  </template>

  <template #footer>
    <!-- footer 插槽的内容放这里 -->
  </template>
</BaseLayout>
```

使用的`#`是`v-slot:`的语法糖简写形式，与其等价。

如果在使用的时候已经使用了默认插槽，那么在组件内的其他地方再写其他元素会引起报错：

```vue
<BaseLayout>
<template #default>
 default content
</template>
<!-- 这里不允许再写内容 -->
content2 
</BaseLayout>
```

## 插槽的特点

### 插槽Props

插槽上使用的`property`是属于父组件的，而不是子组件，因为我们在父组件中使用插槽。

但是，子组件可以为插槽提供数据，通过`props`来传递：

```vue
<!-- <MyComponent> 的模板 -->
<div>
  <slot :text="greetingMessage" :count="1"></slot>
</div>
```

```vue
<MyComponent>
    <template v-slot:default="{text, count}">
    {{ text }} 
    {{ count }}
    </template>
</MyComponent>
```

因为使用的是**有且仅有**默认插槽，可以直接它写到组件上，即可以简写为：

```vue
<MyComponent v-slot="slotProps">
  {{ slotProps.text }} {{ slotProps.count }}
</MyComponent>

<!-- 或者 -->
<MyComponent #default="slotProps">
  {{ slotProps.text }} {{ slotProps.count }}
</MyComponent>
```

如果不只有默认插槽，那么上面这种语法糖就会被禁用，使用起来会报错。

### 本质

可以将作用域插槽类比为一个传入子组件的函数：

```js
MyComponent({
  // 类比默认插槽，将其想成一个函数
  default: (slotProps) => {
    return `${slotProps.text} ${slotProps.count}`
  }
})

function MyComponent(slots) {
  const greetingMessage = 'hello'
  return `<div>${
    // 在插槽函数调用时传入 props
    slots.default({ text: greetingMessage, count: 1 })
  }</div>`
}
```
