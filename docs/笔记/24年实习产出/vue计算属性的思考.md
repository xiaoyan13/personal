# vue 的一些误区

## 误区1: computed 内部优化机制

### 导言

对于初学者而言，计算属性是一个很模糊的东西。我们在学习过程中，也许会经常听到别人说类似这样的言论：

> 计算属性只有在所用到的响应式变量值改变的时候才会重新计算.

却殊不知，**这句话实际上是非常错误的**、不准确的。

这种不正确的言论，干扰了 vue 玩家的正常思维。之所以出现这样的错误言论，可能是因为官方文档并没有特别强调和明确相关的说法，文档的翻译虽然很好，但终究是翻译，一些地方虽然非常妥善、非常准确的译到了中文，却反而造了成一些误解。

### 论证

我们知道，计算属性副作用内部关联的响应式变量的值变动，会触发计算属性副作用。“计算属性用到的响应式变量改变”这件事，意味着计算属性对应的 `getter` 副作用被触发，这最终导致它的  `scheduler`  的 **被立即调用**。在 `v3.4` 之前，该副作用 `scheduler`，会做一件事，就是 `trigger`。这导致所有用到该计算属性的 `effect` ，都将被**立即重新计算**。

所谓的优化机制，指的是**立即重新计算**的这个动作。当所有用到该计算属性的 `effect` 被重新调用执行的时候，他们理所当然的会去*获取计算属性的值*。对，它就是 `computed` 的 `get value()`。当它被调用的时候：

- 它将率先检查本 `computed` 的 `dirty` 是否为 `true`。如果为假值，他将直接返回本 `computed` 内部记录过的 `value` 值。
  - 这意味着，是否如果 `dirty` 为假值，不会产生任何额外计算开销。
- 如果是真值，它将调用一次 `getter` 。这导致该副作用被重新执行，副作用和关联的响应式变量重新建立映射关系，产生一系列计算开销，最后返回新的值，并返回。
  - 返回后，`computed` 更新内部记录的 `value` 值。

通过观察整个流程我们可以知道，实际上这层优化机制很简单，就是 `dirty` 是否 `true` 来判断是否重新计算。那么谁影响 `dirty` 呢？

- 前面提到，计算属性副作用内部的响应式变量的值变动的时候，计算属性对应的副作用的 `scheduler` 被调用。`dirty` 就是在此被变为 `true`。
  - 所以，总结就是，在 `v3.4` 之前，`dirty` 变为真值的瞬间，标志着计算属性副作用用到的响应式变量发生了改变，也意味着 `scheduler` 将会进行 `trigger` 去调用所有用到计算属性的副作用进行更新。
- 在 `v3.4` 及之后，计算属性 `getter` 副作用用到的响应式变量更改后，触发了计算属性副作用，调用了 `scheduler`，该 `scheduler` 不会立即去 `trigger` 了。他会先执行一遍副作用 getter，拿到新值（**所以新值还是立即重新计算出来了！**），然后比对新值和旧值：
  - **如果新的值和旧的值不同**，那么就和原来一样正常的触发 `dirty` 变为 `true`、  触发 `trigger`。
  - 如果相同，那么就直接 `return`。
  - 所以，总结就是，在 `v3.4` 及以后，`dirty` 变为真值的瞬间，标志着计算属性的值受到它用到的响应式变量影响而发生了改变，也意味着 `scheduler` 将会进行 `trigger` 去调用所有用到计算属性的副作用进行更新。

## 误区2: computed 作为 prop

### 复现

响应式变量的更新一定会触发 `effect`，也就是重渲染。但是渲染过程中，新旧变量的比对却有时候不尽人意，尤其是响应式变量用作 `prop` 的时候。

- 我们先假设一个深层的响应式变量作为 `prop`：

当该变量作为 `prop` 的时候，它被子组件接收，被 `watch`：

```vue
<Component :myRef="myRef">
// child
const props = defineProps({ myRef })
watch(props.myRef, () => {...})
```

`prop.myRef` 是一个 `reactive`。所以他能够被正常的 `watch`.

- 我们使用一个 `computed` 计算属性作为 `prop`:

当该变量作为 `prop` 的时候，它被子组件接收，被 `watch`：

```vue
// father
<Component :myComputed="computedRef">
// child
const props = defineProps({ myComputed })
watch(props.myComputed, () => {...})
```

这里出问题了： `prop.myComputed` 是一个普通的变量了。`.value` 的解构，导致它成了一个普通变量。

所以我们可以这样写：

```vue
// father
<Component :myComputed="computedRef">
// child
const props = defineProps({ myComputed })
watch(() => props.myComputed, () => {...})
```

在 `vue` 中，`props` 其实是一个 `shallowRective`。这是官方文档没有提到的另一个比较有用的信息。

我们在 `watch` 的 `effect` 里使用到了 `prop`，监听 `myComputed` 变化。这是我们的惯用写法。但是问题就出现在这里。

试想一下，如果 `props.myComputed` 其实是一个对象的话，会发生什么？如果我们在父组件中更改了某响应式变量的值，它触发了 `computed` 的副作用 `scheduler`。

- 在 `vue3.4` 之前，这将直接导致 `trigger`，即相关渲染器代码被重新调用，重渲染
- 在 `vue3.4` 后，还需新旧值引用比对不同才能导致。

由于它是一个对象，所以会导致两个版本的行为不一致：在 `vue3.4` 之前，直接导致 `trigger`；而在新版本中，由于它是一个对象，新旧值引用对比相同，不会造成视图的重新渲染。

所以，首先能得到的警语总结就是：

> 新版本的computed，应该始终返回一个不一样的对象引用才能触发更新。

但这只是首先。

### 附加BUG1

我们来看看旧版本(`v3.4` 之前)的表现，即直接触发 `trigger` 之后的故事。`trigger` 被触发后，重渲染被调用，渲染器对比新旧 `VDOM`，没有发现 `prop` 变化了（因为新旧 `VDOM` 持有的 `prop` 是同一个引用。）。这导致子组件被复用，而不是重新渲染。

好的，到这里，新的问题又产生了：虽然触发了重渲染，但是视图没更新...那么怎么解决呢？

- 最简单的方案，让 `computed` 每次返回一个新的对象，这样 `render` 的 `dom` 比对将对新旧 `prop` 比对为 `false`。
- 传递一个**具有深层响应性**的响应式对象。这样，即使 `prop` 比对失败（其实这个"比对失败"是相对而言的，你说它比对失败，它设计本身就是理所当然的认为，相同的引用就不需要更新...），由于内层组件拿到的仍然一个响应式对象，所以可以随便的进行 `watch`。

### 附加BUG2

虽然这会给文字的论述增加更多的复杂性，但我还是想要引入 [#10159](https://github.com/vuejs/core/issues/10159)。

```vue
// 在同一组件内，v3.4 之前
const myComputed = computed(() => { ... }})
watch(() => myComputed.value, () => { cb1 })
watch(() => myComputed.value, () => { cb2 }, {deep: true})
```

在上述代码中，如果 `myComputed.value` 是一个普通对象，那么哪个 `watch` 能监听到 `myComputed.value` 内部的属性发生了变化？

答案是，`cb1` 不会调用，`cb2` 会。但实际上，两个 `watch` 其实都在 `myComputed.value` 发生变化的时候被触发了。这是[详细解释](https://github.com/vuejs/core/issues/10159#issuecomment-1900842106)

在新版本中，如果 `myComputed.value` 是一个普通对象，那么两个 `watch` 都不再会触发，因为触发条件变成了严格的计算属性值的变化，而不是计算属性副作用的 `secheduler` 被重新调用，所以也就不会触发 `trigger`。

## vue 内部原理

整个视图模板（`.vue` 文件），被编译成 `js` 代码后，实际上是一个返回 `VDOM` 树的 `render` 函数。实际的某个组件的渲染操作，实际上是**渲染器**做的，它调用该组件的 `render` 函数，拿到 `VDOM` ，并根据拿到的 `VDOM` 生成 `html`。这个操作过程的代码片段，被 `effect` 副作用包围，这样在响应式变量变化的时候，就会触发渲染器内部分代码片段的重新运作：该响应式变量所在的组件的渲染函数被重新调用，获取新 `VDOM`，比较之前的 `VDOM` (如果有的话)，然后根据新旧 `VDOM` 的差异调用对应的所有在 `template` 中出现的响应式变量，无论它是处在什么位置，`{{}}` 中也好，作为标签的属性也罢，都会因为它的变化，它所在的组件被重新渲染(`rerender`)。

举个例子来讲，如果一个响应式变量在组件上，那么它的变化会导致对应组件的重新渲染：

- 首先调用 `render` 得到的新 VDOM，这个过程的速度取决于该组件内的元素节点的数量。所以 `v-for` 大量生成，它这一步生成 `VDOM` 会很卡。
- 和旧 VDOM 进行对比；这一步往往是很快的，相信 `diff` 算法。
- 多退少补地调用相关的 `js` 来修补好正确的页面。这一步是原生的 `js` 直接操作 `jsDOM`，往往会很快。

## 警语 & 建议

- `computed`, `ref` 和 `reactive` 分别有自己的 `track` 和 `trigger` 机制，这导致了一些不太直观的问题。**仔细地**、**逐字逐句**地去阅读 `vue` 官方中文文档，不要囫囵吞枣地看，不然迟早搬起石头砸自己的脚。
- 新版本的 computed，应该始终返回一个不一样的对象引用，除非你知道该对象不会再触发其他响应式链。
- `prop` 是一个 `shallowReactive`。如果需要，你可以传递 `prop` 的时候传入一个深层的响应式对象来实现深层次的响应式。
- `ref` 和 `reactive` ，建议尽可能地使用 `ref` 。因为 `.value` 作为响应式对象的标识更加醒目，你很清晰的知道自己在用一个 `vue` 提供的响应式变量。而 `reactive` 不那么直观。

## 参考

[官方文档：计算属性稳定性](https://cn.vuejs.org/guide/best-practices/performance.html#computed-stability)

[issue#10159](https://github.com/vuejs/core/issues/10159)

[Vue Conf 2021视频录像:  对 vue 用户的一些建议](https://www.bilibili.com/video/BV1x54y1V7H6/?vd_source=5e8bba4ef06ad0ca393ce568e9d08ed3)
