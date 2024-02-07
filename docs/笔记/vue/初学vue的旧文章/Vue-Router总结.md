# Vue-Router总结

被这玩意折磨了半天，感觉自己不会善用F12调试工具。有报错看不懂，还不想去翻译，结果就导致在坑里出不来，试了半天才发现自己那么傻。

## 安装Vue-Router4

实验环境为`node.js`和`vite`，并且代码采用选项式API。

```js
npm install vue-router@4
```

安装完成后，检查工程项目中`package.json`，多了`"vue-router": "^4.1.6"`字样，安装成功。

## 初步配置

新建`router/index.js`，加入如下内容：

```js
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import {createRouter, createWebHashHistory} from 'vue-router'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes, // `routes: routes` 的缩写
})

export default router
```

其中，`Home`和`About`都是已经写好的组件，他们位于`views`文件夹里。我们引入了`createRouter`，它负责创建一个路由组件router；还有一个`createWebHashHistory`，它负责router中的`history`字段创建。router中的history和routes都是必须写的。而routes中的path和component都是必须写的。

router的原理后面会详细叙述。现在只需要知道router是已经写好的路由组件，其组成不用管。我们创建好组件之后，把它`export default`丢出去。

然后，为了使用它，我们`main.js`中把导入它：

```js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index'

import './assets/main.css'

const app = createApp(App);

app.use(router)
    .mount('#app'); //先导入router，再挂载 
```

`App.vue`可以写一个空templete。我们用它创建了一个组件，并use了导入的路由组件，最后把整个组件挂载到了app上。（当然也可以直接用router创建一个组件，挂载到app上，这里只是习惯）。这样，路由组件就被挂载到了我们的`app`上。

```js
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <link rel="icon" href="/favicon.ico">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vite App</title>
</head>

<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>

</html>
```

上面是根页面，可以看到app就是一个简单的div，什么都没写。现在我们切到浏览器，刷新页面，控制台没有报错，说明成功。

## 基本使用

上述操作把路由组件挂在了`App.vue`组件上了，所以我们需要在`App.vue`中使用它：

```js
<script>
export default {
  data: function () {
    return {
    }
  },
}
</script>

<template>
<div>
  <h1>Hello App!</h1>
  <p> <!--通过传递 `to` 来指定链接 -->
    <!--`<router-link>` 将呈现一个带有正确 `href` 属性的 `<a>` 标签-->
    <router-link to="/">Go to Home</router-link>
    <br>
    <router-link to="/about">Go to About</router-link>
  </p>
  <!-- 路由出口 -->
  <!-- 路由匹配到的组件将渲染在这里 -->
  <router-view></router-view>
</div>
<!--使用 router-link 组件进行导航 -->

</template>
```

这样保存刷新页面，就会看到跳转连接了。我们可以看到新加的两个标签`router-link`,`router-view`，他们实际上就是`router`组件的标签，通过使用该标签来操纵router。他们的实现原理后面叙述。

## Router的实现原理

router标签的响应原理实际上是history，路由模式。不同的vue版本叫法不同：

```js
//vue2 mode history 对应 vue3 createWebHistory
//vue2 mode  hash   对应 vue3 createWebHashHistory
//vue2 mode abstact 对应 vue3 createMemoryHistory 用于ssr，这里不讲
```

createWebHashHistory默认通过`Location.hash`去匹配，它的最大特点就是url里面有`#`。hash是什么？它是url中#及其后面的部分，常用作锚点在页面中进导航。改变url中的hash部分不会造成页面刷新。它是如何监听到url被改变的呢？

通过`window.addEventListener('hashchange',()=>{})`事件（第二个参数是一个回调）,可以监听url的变化。url总共有三种变化：

- 通过前进后退键请求改变url；
- 通过`<a>`标签或`<router-link>`标签改变url（这里更推荐使用router-link标签，因为他不会刷新页面）
- 通过`windows.location`请求改变url。

createWebHistory则通过h5的`history`去路由匹配的。我们点开一个vue写的网址，如果在页面中来回切换没发现`#`，那么大概率就是它。而它监听url改变的原理是另一个函数：通过`window.addEventListener('popstate',()=>{})`事件去监听。

当url尝试改变的时候（比如触发router-link），router会去根据上面的路由模式`history`和`path`路径自动的进行`component`组件跳转，并渲染`router-view`，从而更新页面（而不是刷新页面）。这就是基本的实现原理。

## 编程式导航

除了使用router-link，vue还提供了`this.$router.push`供我们更加灵活的在不同的标签中调用router。

```js
<template>
  <div>
    <h1>Hello App!</h1>
    <p>
      <!--方式1：`<router-link>` 将呈现一个带有正确 `href` 属性的 `<a>` 标签-->
       <!--通过传递 `to` 来指定链接 -->
      <router-link to="/">Go to Home</router-link>
      <br>
      <router-link to="/about">Go to About</router-link>
      <br>
      <!--:方式2：通过toPage函数方式来调用router -->
      <button @click="toPage('/')">Go to Home</button>
    </p>
    <!-- 路由出口 -->
    <!-- 路由匹配到的组件将渲染在这里 -->
    <router-view></router-view>
  </div>
  <!--使用 router-link 组件进行导航 -->

</template>

<script>
export default {
  methods: {
    toPage(url) {
      //this.$router.push需要一个参数。
      //可以传name，也可以传url字符串，还可以传对象，对象里面有name或者path之一。
      this.$router.push({
        path: url
      })
    }
  }
}

</script>
```

此外，`to`可以设定为父子传参`props`，格式可以是`:to={name:...}`。

总结起来，我们可以用最基本的to属性路由，也可以用`:to`来绑定name路由，还可以用点击事件等来绑定一个函数，在函数中使用`push`进行路由处理和跳转；函数`push`有两种传参方式，一种是url字符串，另一种是对象，对象里面可以有`name`属性或者`path`属性（二选一）。

## 历史记录处理

我们知道，点击到新链接之后可以按回退键返回到旧的页面。有些情况下，我们不希望用户可以返回，这个时候就可以在`router-link`标签上加一个`replace`属性，用于自动的销毁历史，从而用户点击新链接之后，回退按钮仍然是灰色（即旧页面不再保留，而是直接清掉）。

而对于编程式导航，把push函数换成replace函数就可以了。实现原理是，进入新页面不会新建页面，而是直接把旧页面替换成新页面，从而没有了历史记录。

### go()和back()

此外，还有两个相关的有用函数是`go()`和`back()`，他们用户返回和前进当前页面（和浏览器上的前进回退基本效果是一样的），他们可以传入一个数字参数，表示一次回退/前进多少个页面。

## 路由传参

### query传参

路由是两个页面的相互跳转的实现者。而这种实现，不仅仅可以实现跳转，还可以为两个页面（或者说是两个组件）传递参数。当一个页面（组件）跳转到另一个页面（组件）的时候，我们可以让路由去记录当前组件的某些信息，携带着该信息跳转到另一个组件，并把该信息丢到新的组件上。

我们只需要在传递的时候，除了`name`和`path`字段外，新增另一个`query`字段即可。该字段被要求必须是一个对象，对象内部携带了要传递的信息。有没有很方便！

这种方式的缺点在于，跳转的时候，传递的信息将作为url的一部分。

### params传参

另一种传参是`param`字段，使用该字段传参，传递的信息不会显示在url上。原理是传入的参数没有保存在url字符串中，而是被vue保存在了内存中，所以看不到。所以这也造成了如果用户刷新页面，就会让之前传的参数丢失的情况。

params传参时，路由必须用`name`，不能用`path`。参数是根据path保存的，而不是把参数保存在了url里。

### params动态传参

`params`跳转通过在路由中设置`:`来绑定。

```js
//index.js 路由
const routes = [
  ...,
  { path: '/para/:id', component: ParamTest }, //把测试组件添加到路由,传参id
]

//App.vue 根组件
<template>
  <div>
    <h1>Hello App!</h1>
    <p>
      <!-- 动态参数 -->
      <button @click="paramTestfunc('/para/1')">拿到id</button>
    </p>
    <router-view></router-view>
  </div>

</template>

<script>
export default {
  data() {
    return {
      testData: 233, 
    }
  },
  methods: {
    paramTestfunc(testData) {
      this.$router.push({
        name:'testpara', //如果要显式传递params参数，则name必传，且value对应路由中name的值
        params: { //传递多个params
          id: 100, //此参数必传，而且key必须和路由中path的`:`后面的字符串匹配
          testData: testData,
        }
      })
    }
  }
}

</script>

//ParamTest.vue 点击后跳转的组件
<template>
    <div>
        {{ params }}
    </div>
</template>

<script>
export default {
    data() {
        return {
            params: this.$route.params //试图拿到id
        }
    }
}
</script>
//注：组合式API由于使用了`setup`特性，所以代码可能和组合式很不相同。
```

对于比较多的`params`，需要定义一个函数来传递，和`query`大致是一样的操作。不同点在于要传递params，必须也要路由的`name`字段，而query则是`name`和`path`二选一。

可以发现，有两个拼写非常相近的对象，`$router`和`$route`。二者含义是不一样的，可以理解为一个是全局设定，另一个是局部设定（绑定某个组件）：前者代表的是一个全局路由，我们调用它的push方法，从而把params传递到另一个组件的`route`里，然后在该组件中通过`this.$route.params`获取到传递的信息。

其实`$route`的称呼是“活跃(active)的router对象”，它代表了**当前页面**的路由。而`$router`的称呼是全局的router实例，通过 vue 根实例中注入 router 实例，从而让整个应用都有路由功能。

## 404 NOT FOUND

如果路由匹配不到，我们可以将其定位到丢失页面组件。这通过正则表达式实现。

```js
//index.js 路由
const routes = [
  ...,
  { path: '/:path(.*)', component: NotFound }, //按顺序匹配，没匹配到的都丢到这个组件里处理
]
```

## 嵌套路由

嵌套路由可以实现多层url。例如`/a/b/c`的形式。关键字是`children`。

```js
//index.js 路由
const routes = [
  ...,
  {
    path: '...', 
    component: ...,
    children: [
     { path:'...',comonent: ...},
        { path:'...',comonent: ...},
        { path:'...',comonent: ...},
    ]
  },
]
```

值得注意的是，`router-link`的`to`是个字符串，代表了绝对url。如果要在`/a`中路由到`/a/b`，`router-link`的to属性还是要写成`/a/b`而非仅仅写`/b`就可以了。

## 命名视图

**一个url对应多个组件**时，可以使用命名视图为每个组件命名，这样他们在调用`router-view`渲染的时候就可以加以区分了。实际上，对于一个url对应一个组件的情况，它的`router-view`也有名字，默认是`default`。

## 重定向与别名

`redirect`与`alias`。对于简单视图和业务逻辑的网站，基本没什么用。

## 导航守卫

路由的前置守卫可以进行页面跳转前的操作，如验证身份，拦截等操作。

路由的后置守卫可以进行页面跳转完成后的操作。

## 路由元信息meta

路由自带的信息。每个url都可以自带一个meta属性，里面存放一些可能有用的东西。

## 动态路由

## 路由 vs 动态组件

vue-router 适用于应用级别的页面间的导航。 而 component-is 适用于区域性功能型模块级别的导航。一句话，如果你需要用户通过 URI 直达某一个视图（包括子视图），那就用路由方案。
