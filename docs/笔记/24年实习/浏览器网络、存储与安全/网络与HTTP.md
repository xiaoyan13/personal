# 网络

计算机网络构成是很复杂的，设计出来的概念繁多，对于 TCP 无法短时间一一了解细节与原理，所以遇到自己感到陌生的问题时，不要去猜测答案，八成错。对于前端来讲，如果涉及到 TCP 的底层原理，不会回答也是很正常的。

## 各层任务

- 物理层解决了如何在链路媒体上传输01比特流
- 数据链路层，比特流封装成帧，提供了MAC帧的转发
- ip层，提供了**基于ip转发**的数据报的路由。数据报就是传输的内容，为一个或多个mac帧。

## 传输层

**传输层通常由操作系统实现，提供ip的进程之间的通信服务。**

### TCP和UDP对比？应用场景是什么？

TCP是面向链接的可靠传输协议，被设计为字节流，类似管道；UDP是面向报文的尽最大努力交付，被设计为报文片段流，支持多播。相对于TCP，UDP的设计比较简陋，没有实现数据的可靠传输，追求`直接转发`的高效率。

|              | UDP                        | TCP           |
| ------------ | -------------------------- | ------------- |
| 连接对象个数 | 一对一，支持一对多，即多播 | 一对一        |
| 传输方式     | 面向报文                   | 面向字节流    |
| 首部开销     | 8字节                      | 20字节~60字节 |

应用场景：TCP 用于低效率但稳定性高的应用，而UDP相反，实时性高但是稳定性差。

### TCP 三次握手和四次挥手过程

- 三次握手

一开始客户端处于 `close` 状态，服务器端处于 `listen` 监听状态；

客户端发送一个 SYN 标识和一个 Seq 序列号，表示请求连接，之后客户端处于 `SYN-SENT` 状态。服务器响应对应的SYN+ACK标识，并返回一个ACK = Seq + 1，和自己的滑动窗口序列号 Seq，之后服务器处于 `SYN-RCVD` 状态；

客户端收到报文后，发送 ACK = 服务器端Seq + 1，进入 `established` 状态。第三次握手可以携带数据。

服务器端收到第三次握手报文后，也进入 `established`。

- 四次挥手

只有主动请求断开连接的一方，有 `time_wait` 状态。

A发送 `FIN` 给 B，B 收到后回复一个 `ACK`。然后 B 再发送给 A 一个 `FIN`，A收到后发送一个 ACK，进入 `time_wait` 状态。等待两个 `MSL`（报文最大存活时间，Maximum Segment Lifetime）后，进入 `closed` 状态。B收到A发送的最后一个ACK，进入 `closed` 状态。

### TCP 的大致原理

- 基于滑动窗口`congestion window(cnwd)` + `ACK`序列号，`ACK` 将滑动窗口中的字节分为两部分，已经确认的，尚未确认的。

- 通过**一些重传机制（超时重传、选择重传）和累计确认**实现数据可靠传输。

  超时重传：ARQ协议，即要求双方超时的时候进行重传，并规定了超时时间的计算方式；

  选择重传：SACK字段，可以在遇到快速重传的时候进行选择重传

  累计确认：TCP对于乱序的接收，可以先保留而不直接丢弃

- 流量控制：

  发送方根据接收方能够承载的吞吐量控制发送的数据量。比如，TCP 使用 Nagle 算法根据对方的窗口大小控制吞吐量。

- 网络拥塞控制算法：包括慢启动、拥塞避免、快速重传、快速恢复。还有主动管理队列 `AQM`。

  慢启动阈值 `ssthresh` （slow start threshold)：

  - 当 `cnwd < ssthresh` ，使用慢开始算法，`cnwd > ssthresh`，使用拥塞避免算法
  - 发生超时，`ssthresh` 减半,滑动窗口回到初始值，重新慢启动。
  - 接到三个连续重复 `ack`，滑动窗口大小变为原来的一半，即 `cwnd = cwnd/2`，（还能收到 3 个重复 ACK 说明网络并不糟糕，没有必要重新慢启动，但可能仍然需要降低吞吐量，所以窗口还是需要调整大小），进入拥塞避免。慢启动阈值设置为 `cwnd`。

### 什么是 TCP粘包 ？如何处理 TCP 粘包？

为了避免浪费，TCP总是避免直接向下传输过小的数据片段，因为报文头本身就占 20 字节了，为了几个字节去单独发送一个 IP 数据报并不划算。TCP 不断在缓冲区积累到一定长度后进行发送，这就是 Nagle 算法。这种算法导致了 TCP 的粘包。

解决方案：

- 接收方：窗口小于 `min( MSS，缓存空间/2 )`时，就向发送方通告窗口为 `0`，也就阻止了发送方再发数据过来。
- 发送方禁用 `Nagle` 算法。
- 手动的添加特殊的标识进行流分段。这也是最常见的方式。

备注：Nagle算法流程：只有满足下面两个条件中的任意一个条件，才可以发送数据，实际上决定性因素是条件一，即知道对方窗口大小，如果不知道，则 Nagle 算法失效：

- 条件一：要等到对方窗口大小 >= `MSS` 并且 数据大小 >= `MSS`；
- 条件二：收到之前发送数据的 `ack` ；

Nagle 算法默认是打开的，如果对于一些需要小数据包交互的场景的程序，比如，telnet 或   ssh 这样的交互性比较强的程序，则需要关闭 Nagle 算法。

### 为什么 UDP 没有粘包？

注意区分粘包和面向流的概念，流是说在实现上，TCP把数据视作流；粘包是流数据每次接收的时候粘在一起。UDP是面向报文的，对于每个报文都是直接转发。粘包的概念是建立在流的概念上的。

## HTTP

### 常见字段

#### 请求

`Host`：所有 HTTP/1.1 请求报文中必须包含一个 `Host` 头字段。值为 `<host>:<port>`。

`Accept`: 请求的 `MIME` 类型。

```http
Accept: */*
```

`Accept-Encoding`: 表示能解析的数据压缩方式。

#### 响应

`Content-type`: 响应的类型。如果是网页：

```http
Content-Type: text/html; Charset=utf-8
```

`Content-Encoding`: 说明服务器传回的数据用了什么压缩方法。

`Content-Length`: 本次回应的数据长度,十进制数字，单位是字节数。它存在是因为TCP的基于字节流的特性：无法判断报文的长度。

#### 跨域相关

1. [`Cookie`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cookie)
2. [`Origin`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Origin)
3. [`Access-Control-Allow-Headers`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Allow-Headers) 响应标头
4. [`Access-Control-Allow-Methods`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Allow-Methods) 响应标头
5. [`Access-Control-Allow-Origin`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Allow-Origin) 响应标头
6. [`Access-Control-Expose-Headers`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Expose-Headers) 响应标头，表示 js 可以读取响应中的哪些标头
7. *[`Access-Control-Allow-Credentials`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials)*  响应标头，为 true 则允许响应被 js 脚本读取
8. [`Access-Control-Max-Age`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Max-Age) 响应标头，允许的跨域时间
9. [`Access-Control-Request-Headers`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Request-Headers)  请求标头，用于通知服务器在真正的请求中会采用哪些请求头。
10. [`Access-Control-Request-Method`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Request-Method) 请求标头

#### 缓存相关

强缓存 `Expires`, `cache-control`, 协商缓存 `Etag`, `if-none-match` / `Last-modifed`, `if-modified-since`；

协商缓存其实是*条件请求*，类似的还有 `if-match` 和 `if-unmodified-since`，`if-range`。服务器会检查资源是否匹配指定的条件，如果匹配，则返回请求的部分内容（206）；否则，可能返回整个资源（200）。

#### 通用标头

- `Connection`：可以用于连接控制，比如长连接，如果发送的值是 `keep-alive`，则连接是持久的，不会关闭，允许对同一服务器进行后续请求。HTTP/1.1 版本的默认连接都是长连接。在 http/2 之后被禁用（http/2 后使用帧而不是传统的请求和响应模型）。

- `Keep-Alive`, 表示长连接的一些信息，比如 `timeout`指定了连接需要保持打开状态的最小时长，`max`表示此连接允许发送的请求数的最大值

### 常见的请求方法

需要说明的是，这些请求方法的具体实现和使用方式并不是定死的，这就意味着，就算违背语义，去使用这些方法构造请求，也不会报错。但是，尽可能的遵循规范，良好的语义化是 api 管理的前提。

增POST，删DELETE，查GET/HEAD，改PUT/PATCH，其他：CONNECT（用于控制连接的属性, 如 长连接、连接升级），OPTIONS（用于连接前的检查，如跨域预检请求）

`PUT` 和 `PATCH` 的区别：二者都是用于修改资源，`PATCH` 是新增的，对 `PUT` 语义进行增强。`PUT` 只能简单的进行资源替换，请求体就是新的要替换的资源。而 `PATCH` 告诉服务器如何修改资源，请求体是修改资源的方式，而不是新的替换资源本身。具体实现上：

```http
// patch 的一个可能的 json 格式的请求体, 服务器解析报文后进行 +1 操作
{
  "method": "increase",
  "path": "/name",
  "do": "+1"
}
```

在语义上，`PUT`是幂等的，而`PATCH`不是。幂等是指不应该具有副作用，也就是说多次请求返回的结果相同，而且不应该对服务器的状态产生影响。

`GET` 和 `HEAD` 的区别：虽然二者都用于查操作，但是返回的结果有差别，规定 `HEAD` 不包含响应体，也就是说它只响应数据的 `http` 头部，这在传输前预先获取文件的大小等信息有用。

### 报文格式

起始行，请求头，空行，请求体。

- 起始行比如: `get /index.html http1.1` 和 `http1.1 200 ok`。

### POST 和 GET 的区别，GET可以带请求体吗？

- 语义上，`post` 请求用于添加数据，`get` 请求用于获取数据。
- 规范上，前者不是安全和幂等的，后者是安全且幂等的。
- 由于幂等性，GET请求一般会被浏览器自动缓存。

RFC 规范并没有规定什么请求方法不能带 body，所以都可以带。

### 304 越多越好吗？

搜索引擎爬虫会更加青睐内容源更新频繁的网站。所以并不是越多越好。产生过多的 304 会造成收录减少和权重下降。

## HTTPS

### HTTP 与 HTTPS 有哪些区别？

比如实现和使用上：

- 在 TCP 和 HTTP 之间加入了一层安全协议 SSL，使得报文能够加密传输。

- 由于加密的过程，HTTPS 在 TCP 三次握手之后，还需进行 SSL 的握手过程，才进入报文传输。
- HTTPS 需要向 CA 机构申请数字签名才能使用。

- HTTP 默认端口号是 80，HTTPS 默认端口号是 443。

### HTTPS 的加密算法？(口述)

加密算法分为两种, 对称和非对称。对称加密中双方使用同一个秘钥对数据进行加密和解密。在握手过程采用非对称加密，在实际的交互过程只是用一个密钥，进行对称加密。对称加密比较简单，主要复杂的是非对称加密，即一开始的握手逻辑。

对于一对密钥而言，它们互相既是一个箱子，也是钥匙。私钥加密，公钥解密，用于鉴权；公钥加密，私钥解密，用于实现安全数据传输。

最初的流程是，服务器把箱子（也就是公钥）给客户端，客户端拿到后把自己的信息装进箱子，实现隐私加密。但是箱子有可能被中间人替换。

**为了防止箱子被替换**，所以才需要CA机构的数字签名。**经过密钥加密过的数据，任何人都可以读，却不可以改**。基于这个特性，将箱子（公钥）交给CA机构用它们的密钥经过加密，服务器公钥仍然任何人都可以读（使用CA机构的公钥解析即可），但是却不可以修改。这样就防止了箱子被替换。对于客户端，CA机构的公钥内置在客户端的操作系统中。

### HTTPS 的握手过程（口述）

1. 客户端向服务器发起请求。
2. 服务器端接收到请求后，给出服务器的公钥和使用的CA证书。
3. 客户端确认证书合法性，收到公钥，生成一个用于后续加密通信的对称密钥，并用公钥加密它，传输出去。
4. 服务器收到了对称密钥。
5. 客户端向服务器发送一个握手结束消息，表示握手过程完成。从此时开始，客户端和服务器使用共享的会话密钥进行对称加密。

## HTTP各个版本

- http1.1
  - 默认启用长连接；
  - 支持分块的流数据传输；支持流水线，即请求可以并行的发送。
  - 缺点：流水线的队头阻塞；无状态，多引入一个 `cookie` 字段保存状态。仍然为明文传输，不安全。
- http2
  - 格式从文本变为了二进制帧，提高了解析速率
  - 头部压缩（`HPack` 算法，能够通过缓存的临时表，消除多个连接中的重复部分，和 huffman 编码压缩 `header` 体积）
  - 多路复用协议，**针对不同的 HTTP 请求分配一个 Stream ID**，解决了之前的流水线问题。
  - 扩展了请求-响应模型，服务器端在一次长连接中，可以选择主动的推送数据。客户端请求的 Stream 必须是奇数号，而服务器主动建立的 Stream 必须是偶数号。
  - 集成了 `https` 的 `TLS`，安全。

- http3
  - 基于的协议从 TCP 改为了 UDP 的 QUIC 协议，旨在为 HTTP 连接设计更低的延迟。

### 在服务器端和网络都低负载的情况下，页面存在大量图片请求，HTTP 各版本的表现？

- 对于 `http1.1` 之前的版本，由于浏览器限制对于同一个域名，持有的 TCP 连接数量最多为 `6`。
- `http1.1` 引入了流水线，所以可用进行一定程度的复用 TCP，但是由于存在流水线的队头阻塞机制，所以对于瞬间的大量请求，不会立即的全部处理掉，而是会在队列中等待。可用通过**域名分片**、多个图片**合并在一次请求**中来优化。
- `http2` 由于支持多路复用，所以能够不断的处理请求。
- `http3` 也不会产生阻塞，不断的处理掉请求。

## RPC

**远程过程调用 RPC 本质上不算是协议，而是一种对TCP的使用方式，对外提供的语言接口，是一种调用方式**。纯TCP是面向连接的可靠的字节流传输协议。正是由于字节流的特性，它存在粘包的特点，即两个数据传输报文没有标识区分，需要在应用层标识。RPC和http，对 tcp 封装，都解决了这个问题。

- RPC相比于 `http`，可以改变协议本身的特性，所以能够做到更高的性能；而 http 是已经写死了的。`http` 用于B/S架构，更古老的`RFC`被广泛用于`C/S`架构。

## WebSocket

它主要是为了解决高实时性同步的场景需求，需要双方都主动推送数据。`http1.1` 被设计为半双工通信，这导致服务器端变化的时候，无法及时的主动推送数据。这是 `http` 被设计为请求-响应模型导致的。

### 原理

浏览器在 **TCP 三次握手** 建立连接之后，都**统一使用 HTTP 协议**先进行一次通信。想要建立 `WebSocket` 连接，就必须进行协议切换的过程。这通过在 `http` 标头中添加特殊的请求头来实现。

```http
Connection: Upgrade
Upgrade: WebSocket
```

如果服务器支持切换为 `webSocket`，则会开始走 WebSocket 握手流程：

```http
HTTP/1.1 101 Switching Protocols
Upgrade: WebSocket
Connection: Upgrade
```

`101` 表示协议切换。就这样经历了一来一回两次 HTTP 握手，WebSocket 就建立完成了，后续双方就可以使用 webscoket 的数据报文格式进行通信了。

报文格式主要还是 `头部+主体`，由于基于 TCP，仍然是面向流的，所以总是会有一个长度信息。

### 使用方法

`onopen`, `onclose`, `onmessage`。

```js
// 在index.html中直接写WebSocket，设置服务端的端口号为 9999
let ws = new WebSocket('ws://localhost:9999');
// 在客户端与服务端建立连接后触发
ws.onopen = function() {
    console.log("Connection open."); 
    ws.send('hello');
};
// 在服务端给客户端发来消息的时候触发
ws.onmessage = function(res) {
    console.log(res);       // 打印的是MessageEvent对象
    console.log(res.data);  // 打印的是收到的消息
};
// 在客户端与服务端建立关闭后触发
ws.onclose = function(evt) {
  console.log("Connection closed.");
}; 
```

### 短轮询、长轮询、SSE 和 WebSocket 间的区别？

都是用于实现服务器主动向客户端推送请求的方式。总的来说，前三种都是基于 `http` 的，通过它提供的特性来实现类似服务器直接推送。

- 短轮询：每隔一段时间就向服务器发一次 http 请求。

- 长轮询：发送一次 http 请求，但是超时时间设置的非常长，服务器收到后到达超时时间才返回。
- SSE（Server-sent Events）：使用响应类型为 `text/event-stream` 的数据，来实现服务器向客户端推送的方式：

服务器端的响应头如下设置，以说明本次响应是一次流：

```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

对应的jsAPI 是 `EventSource`。

- webSocket：一种新的协议，专门用于全双工通信，克服了 http1.1 协议的半双工通信。

## DNS

- 本地域名服务器、根域名服务器、顶级域名服务器、权限域名服务器
- 向本地域名服务器查询域名，使用递归查询，本地域名服务器对上使用迭代查询。这样设计是为了提高效率和减轻高层服务器负担。（想象一下一张图，递归查询会大幅增加请求数量，即边的数量。）

