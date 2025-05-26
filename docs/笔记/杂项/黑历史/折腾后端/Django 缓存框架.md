# Django 缓存框架简介

缓存可以分为上游缓存和下游缓存。下游即前端，浏览器缓存。上游是指服务器的缓存。

为了避免在短时间内用户重复刷新页面，或是在需要复用页面时，频繁的进行数据库查询等事务处理操作，缓存将一些指定的页面存在内存memory中，下一次用户请求的时候可以复用它。

django自带的缓存框架原生的支持Memcached（一个基于内存的缓存服务器），从而可以实现这一技术。

在settings.py的caches字典中配置相关参数：

```python
caches = {
    'default': { #每一个键值都是一个缓存后端，默认为default
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}
```

Memcached 以一个守护进程的形式运行，并且被分配了指定数量的 RAM。它所做的就是提供一个快速接口用于在缓存中添加，检索和删除数据。（守护进程：独立于终端而存在的系统级别进程。他们可以与应用级别进程交互，辅助应用进程干一些事。）

Memcached需要独立安装，具体参考<https://pythondjango.cn/django/advanced/7-cache/>

关于它的具体的缓存设置：<https://docs.djangoproject.com/zh-hans/4.1/topics/cache/#memcached>

另外，分布式缓存（多台服务器上缓存，Django会把它们当成一个大缓存）的技术我不太懂，估计也用不到。

最后，记住不要用缓存来保存唯一的数据（重要的数据）。应当立即将其更新数据库，而不是搁置在内存中——缓存只是为了临时存储，而不是永久存储。当出现意外宕机等突发情况，内存会被清空，这时所有的数据将丢失。

除了memcached，django还支持其他缓存类型，如redis缓存，数据库缓存， 文件系统缓存， 本地内存缓存， Dummy缓存（用于测试）。

## 如何使用（简单介绍）

当你做好有关缓存的设置后，在Django项目中可以有四种方式使用Cache。

- 全站缓存
- 在视图View中使用
- 在路由URLConf中使用
- 在模板中使用

### 1 全站缓存(per-site)

是依赖中间件实现的，也是Django项目中使用缓存最简单的方式。这种缓存方式仅适用于静态网站或动态内容很少的网站。

### 2 在视图View中使用

此种缓存方式依赖`@cache_page`这个装饰器，仅适合内容不怎么变化的单个视图页面。

### 3 路由URLConf中使用

同样`@cache_page`这个装饰器，只不过在`urls.py`中使用。区别在于，视图装饰器硬编码了视图，即一个视图只要被它修饰，那么就会被缓存。这会导致视图和缓存系统发生耦合。有一种情况是，从另一个url同样访问到该视图，但不希望它被缓存。虽然这种需求可能很少，但它确实存在。提供的解决方案是，我们可以把修饰器从视图层改为放在路由层，以达到这种效果。

### 4 模板中使用缓存

与`@cache_page`缓存整个页面不同，模板缓存的颗粒度更细，可以用来缓存内容不怎么变化的 HTML 片段。具体的使用方式如下，首先加载`cache` 过滤器，然后使用模板标签语法把需要缓存的片段包围起来即可。

```python
{% load cache %}
{% cache 500 sidebar request.user.username %}
    .. sidebar for logged in user ..
{% endcache %}
```

### 5 自定义缓存

实际缓存应用中，Django提供的缓存中间件、装饰器或者模板cache标签分的还是不够细，有时候你需要在视图中自定义数据缓存。

#### django.core.cache.caches

django允许你通过字典访问缓存对象。如果键名不存在，将会引发 `InvalidCacheBackendError` 错误。

```python
>>> from django.core.cache import caches
>>> cache1 = caches['myalias']
>>> cache2 = caches['myalias']
>>> cache1 is cache2
True
```

此外，为了支持线程安全，将为每个线程返回缓存后端的不同实例。

#### django.core.cache.cache

这个对象等价于 `caches['default']` 。它有两个基本的接口：

```python
cache.set(key, value, timeout=DEFAULT_TIMEOUT)
cache.get(key, default=None)
# key 是一个字符串，value 可以任何 picklable 形式的 Python 对象。
# timeout 参数是可选的，默认为 CACHES 中相应后端的 timeout 参数。它是值存在缓存里的秒数。timeout 设置为 None 时将永久缓存。timeout 为0将不缓存值。如果对象不在缓存中，cache.get() 将返回 None。

>>> cache.set('my_key', 'hello, world!', 30)
>>> cache.get('my_key')
'hello, world!'
```

### 6 清理缓存

当你的模型有所变化(比如删除或更新)时，你还需及时地清除老的缓存，这个可以通过Django的信号机制实现。

## 正向代理与下游缓存

缓存由“下游”的浏览器缓存执行。浏览器系统甚至可能在请求到达您的网站之前为用户缓存页面。下游缓存是一个很好的效率提升，但是它有一个危险：许多**网页的内容基于认证和其他变量的不同而不同**，而**纯粹基于 URL** 的盲目保存页面的缓存系统可能会将不正确或敏感的数据暴露给那些页面的后续访问者。

比如说，你操作一个网络电子邮件系统，“收件箱”页面的内容取决于哪个用户登录。如果 ISP 盲目缓存您的站点，那么通过 ISP 登录的第一个用户将为随后的访问者缓存其特定于用户的收件箱页面。那就不妙了。

幸运的是，HTTP 为这个问题提供了解决方案。存在许多 HTTP 报头以指示下游缓存根据指定的变量来区分它们的缓存内容，并且告诉缓存机制不缓存特定的页面。具体参见<https://www.roohui.com/help/tutorial/django_3_1/topics/cache.html#downstream-caches>
