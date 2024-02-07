# Vue概述

## Vue的加载过程

通过CDN引入Vue，有两种方式。第一种全局暴露一个`Vue`对象，第二种方式则利用`ES6模块语法`引入。

### 使用全局构建

```vue
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>

<div id="app">{{ message }}</div>

<script>
  const { createApp } = Vue
  
  const app = createApp({
    data() {
      return {
        message: 'Hello Vue!'
      }
    }
  })
  
  const vm = app.mount('#app')
</script>
```

代码解析：

`Vue`相关的`js`代码，会选定`html`中的一个`dom`元素进行渲染。一般把这个元素叫做`根组件`，它就是整个页面的内容载体：

```vue
<div id="app"></div>
```

全局构建版本，通过`CDN`暴露出一个`Vue`构造函数，在下面的`script`代码片段中，使用该函数创建了一个Vue实例，并通过它的`mount`方法绑定到`id`为`app`的`div`上，从而能够操作`div`，控制整个页面的内容。

所以，Vue本质上就是寻找到了一个`dom`对象，并对其进行操作，只不过这个对象比较"大"，代表了整个页面。

### 使用ES模块构建

```vue
<div id="app">{{ message }}</div>

<script type="module">
  import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
  
  createApp({
    data() {
      return {
        message: 'Hello Vue!'
      }
    }
  }).mount('#app')
</script>
```

在比较新的语法中，ES模块也可以用`importmap`来别名引入：

```vue
<script type="importmap">
  {
    "imports": {
      "vue": "https://unpkg.com/vue@3/dist/vue.esm-browser.js"
    }
  }
</script>

<div id="app">{{ message }}</div>

<script type="module">
  import { createApp } from 'vue'

  createApp({
    data() {
      return {
        message: 'Hello Vue!'
      }
    }
  }).mount('#app')
</script>
```

## Vue的基本原理

几个核心概念：

- 单页面应用(SPA)
- 组件化布局
- 响应式数据
- 路由页面跳转

在前后端分离后，前端框架`vue`采用**单页面布局**，依靠**组件**挂载的方式形成整个页面。

在整个项目打包成由纯`html`,`css`,`js`代码组成的只含有一个入口`html`的`dist`文件夹后，收到用户的网站请求，把打包后的网站项目传到用户所在的浏览器，浏览器解析运行根`html`，并加载出`首屏`。

此后用户在该页面的操作全部都由`js`代码进行**监听**，即响应式，通过卸载和挂载页面组件的方式达到多页面的效果，实质上还是同一个页面。因此，`Vue`需要借助`Vue-router`来实现一个路由，来模拟出类似**多页面不同链接**之间跳转的效果。
