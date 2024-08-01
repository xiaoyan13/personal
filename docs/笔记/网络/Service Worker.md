# Service Worker

## Service worker 的出现背景

在前端资源的获取这块，过去的客户端完全听从于服务器端，客户端通过服务器端web服务器http响应，来决定资源缓存和网络请求的下一步行为。

但是在服务器无法连接状态下（如宕机），客户端无法连接服务器端， 自然无法获取资源、渲染资源，被指示处理下一步的前端资源。

客户端缺乏一个模块，用于独立的在断网状态下对本地资源缓存和自定义的网络请求进行控制。

### 离线优先

使用 service worker，可以将 webAPP 设置为首先使用缓存资源，从而即使在离线状态，也可以提供默认的网页体验，然后再从网络获取更多数据，称为“离线优先”。

## 基本概念

service worker 采用 JavaScript 文件的形式，控制关联的页面或者网站。用户首次访问 service worker 控制的网站或页面时，service worker 会立刻被下载。（具体来说，首次加载页面时， [`ServiceWorkerContainer.register()`](https://developer.mozilla.org/zh-CN/docs/Web/API/ServiceWorkerContainer/register) 方法注册一个 service worker。如果注册成功，service worker 就会被下载到客户端并尝试安装、激活。该方法是一个异步操作，所以不用担心它阻塞首次访问时首屏的渲染。）

一个网站中的多个页面可以由同一个 Service Worker 浏览器线程来控制，而不是每个页面都对应一个独立的 Service Worker 线程。service worker 的 scope（控制范围）是基于路由的。service worker只控制它 scope 内的路由。

只能通过 HTTPS 提供service worker代码——出于安全原因，Service worker 仅限在 HTTPS 上被提供。

### 激活

Service worker 会开始运行在 worker 上下文：它无法访问 DOM，相对于驱动应用的主 JavaScript 线程，它运行在其他线程中，所以不会造成阻塞。它被设计为完全异步，所以尽可能不要在 service worker中使用长时间的同步操作。

## 步骤

1、注册、下载、安装

- [`ServiceWorkerContainer.register()`](https://developer.mozilla.org/zh-CN/docs/Web/API/ServiceWorkerContainer/register) 方法注册一个 service worker。如果注册成功，service worker 就会被下载到客户端并尝试安装。该方法是一个异步操作，所以不用担心它阻塞首次访问时首屏的渲染。

2、安装完毕

- [`install` (en-US)](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/install_event) 事件：该事件触发时，标志service worker已经刚安装，处于准备状态。当 `install` 程序处理完成时，service worker 被视为已安装。

- 安装后，对于该网站，可能浏览器内部已经有先前的 service worker 的旧版本了。这种情况下，安装的新版本不会被激活，而是静默。只有等到旧的 service worker 发现浏览器中已经没有它控制的网站的标签页时，新的 service worker才会被切换。

  可以在install事件中调用 [`skipWaiting()`](https://developer.mozilla.org/zh-CN/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting) ，它将要求所有已打开的页面的 service worker 被立即更新，而无需要求打开的页面全部关闭。然后，新的 service worker 将立即被激活（收到 `activate` 事件），并将接管作用范围内任何打开的页面。

  总的来书，安装后如果想激活，必须满足：

  - 之前存在 sw，则调用skipWaiting()可以将旧的全部替换并激活。
  - 之前没有 sw，则立即进入激活状态。

3、激活

- 激活后，对于一个网站域（scope），只存在一个service worker。 虽然service worker控制它scope内的路由，但是它必须是在sw**激活之后**加载的路由。 所以它对于下载 sw 的本页面是不生效的，新激活的 `Service Worker` 将在下一个页面加载时才开始控制客户端。为了立即让本页面被它控制，可以调用 [`clients.claim()`](https://developer.mozilla.org/zh-CN/docs/Web/API/Clients/claim) 方法。
- 每当获取新版本的 service worker 时，都会再次发生此循环。

## API使用

- 初始化：位于windows.navigator.serviceWorker.register()
- 规定 service worker 最大的作用域是 worker 所在的位置。这意味如果要用一个sw控制整个网站的路由，就必须把它的注册的js代码文件放在网站的根目录中。

- Service worker 的顶层 this 是 `ServiceWorkerGlobalScope`。这本质上是一种特殊的上下文，在主脚本执行线程之外运行，没有访问 DOM 的权限。
