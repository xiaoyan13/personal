# 你所不知道的js-第二部分

## 异步的相关概念

- 异步，本质上是单线程的`js引擎`充分压榨`cpu`时间的行为。
- 在ES6之前，js语言是没有异步这个名词的，只有回调函数作为异步的天然实现。

- 并没有规范指定`console`方法族的工作规范，这并不是`js`标准的一部分。这个工作是宿主环境决定的事情。所以，一个离谱的可能性是，宿主环境把`console`输出设计成了异步请求，这将导致输出和代码运行顺序颠倒。这种行为特性被称为"I/O的异步化"。

- 不要去编写*同步*请求。尽管技术上可以，但是它看起来毫无用处：对于客户端来讲，它一般只会造成锁定用户`UI`的效果。

- 并发是一种能够同时处理多个任务的能力，而并行是一种多个处理器可以同时处理不同任务的能力。多线程是并发的实现。

  多线程的程序意味着多个线程执行一个代码。虽然本质上，只有一个线程在运作，但是这些线程共享资源。这意味这些线程运行完整个代码后得到的结果是不确定的。参见中卷p145页实例。

  js是单线程的。这意味我们不需要考虑这种底层行为。js采取的策略是异步，即充分的去压榨一个线程的资源：在cpu足够强大的今天，一个线程往往已经很够用了。总之，js的世界里不存在多线程，只存在单个线程中的事件循环，而且**事件**是以作用域（通常表现为**回调函数**）为单位排队处理的，而非语句顺序级别的处理。这种设计极大的降低了js的复杂度。

- 单线程的事件循环也是并发的实现。换句话说，当两个或多个任务可以在**某一段短时间段内**启动、执行和完成时，就可以称之为并发。

## js异步警语

- 当两个异步事件互不影响的时候，结果返回前后顺序的不确定性是可以接受的。我们讨论异步，其实就是在处理两个或多个异步事件相互影响的情况，即处理**竞态**。当这些异步事件组成一条顺序链后，尝试揣测多条链之间的执行顺序是很蠢的事情，这没有意义。如果有必要，重构多条链合并成一条链，以显式的说明执行顺序。

- `var` 对于异步竞态的协调是一个麻烦事。最好不要有变量提升行为。异步本来就麻烦，还要牵扯的作用域提升，就很头疼了。
- 严格的，`setTimeout(..., 0)`并不直接把回调函数插入到事件循环队列中去。`Node.js` 的 `process.nextTick(...)` 也如此。尽管它们都很方便，绝大多数情况下都可以直接使用，但是心中还是要有底，明白它们终究还是先和宿主环境打了交道，然后立即被插入到了循环队列中。
- 同步事件有时候也会出现类似于异步的阻塞现象（比如循环数量非常大的 `for` ），这个时候可以采用 *并发协作* 的方式，把它切割成多个小事件丢入事件循环队列或者任务队列中，让主代码得以在单次小事件结束后继续运行下去。

## 手写 Promise

- 下方代码长度及其长，酌情阅读，仅供参考；
- 内部使用 `setTimeout` 来模拟异步，所以它不能和 `setTimeout` 混用；
- 它在单个 `Promise` 实例下，表现和原生相同。事实上，也不应该去讨论多条 `promise` 链之间的交互，这是没有意义的。

```js
class MyPromise {
    static PENDING = "pending";
    static FULFILLED = "fulfilled"
    static REJECTED = "rejected"
    constructor(executor) {
        // 设置初始转态
        this.status = MyPromise.PENDING;
        this.value = null;
        this.callbacks = []

        if (typeof executor !== "function") throw new TypeError("executor is not a function");
        try {
            executor(this.resolve.bind(this), this.reject.bind(this));
        } catch (error) {
            console.log(error)
            this.reject(error)
        }
    }

    resolve(value) {
        if (this.status === MyPromise.PENDING) {
            this.status = MyPromise.FULFILLED;
            this.value = value;
            this.callbacks.map(callback => {
                setTimeout(() => callback.OnFulfilled(value))
            });
        }
    }

    reject(reason) {
        if (this.status === MyPromise.PENDING) {
            this.status = MyPromise.REJECTED;
            this.value = reason;
            this.callbacks.map(callback => {
                setTimeout(() => callback.OnRejected(reason))
            })
        }
    }

    then(OnFulfilled, OnRejected) {
        OnFulfilled = OnFulfilled ?? function (value = this.value) { return value };
        OnRejected = OnRejected ?? function (error = this.value) { return error };

        let promise = new MyPromise((resolve, reject) => {
            // 此处的 setTimeout 不能分别放在每个 if 中，语义变了
            // 要把新的回调率先的加入异步队列，即率先使用 setTimeout，让这个操作变成异步的，再在下一次从异步队列中取出该回调，判断此时的状态是 pending 还是等等。
            setTimeout(() => {
                if (this.status === MyPromise.PENDING) {
                    this.callbacks.push(
                        {
                            OnFulfilled: (value) => {
                                try {

                                    this.parse(promise, OnFulfilled(value), resolve, reject);
                                } catch (error) {
                                    reject(error);
                                }
                            },
                            OnRejected: (reason) => {
                                try {
                                    this.parse(promise, OnRejected(reason), resolve, reject);
                                } catch (error) {
                                    reject(error);
                                }
                            }
                        }
                    );
                }

                if (this.status === MyPromise.FULFILLED) {
                    try {
                        this.parse(promise, OnFulfilled(this.value), resolve, reject);
                    } catch (error) {
                        reject(error);
                    }
                }
                if (this.status === MyPromise.REJECTED) {
                    try {
                        this.parse(promise, OnRejected(this.value), resolve, reject);
                    } catch (error) {
                        reject(error);
                    }

                    // 未重构前的实现
                    // try {
                    //     // 本次 promise 的处理结果 会传递给下次 promise 的 resolve
                    //     let result = OnRejected(this.value);
                    //     // 对返回值是 promise 的特殊处理：调用一次该 promise 的 then() 方法
                    //     // then 内部执行下个 promise 的 resolve(value), value是该 promise 的 value;
                    //     if (result instanceof MyPromise) result.then(value => resolve(value), reason => reject(reason));
                    //     else resolve(result);
                    // } catch (error) {
                    //     reject(error);
                    // }

                }
            })
        })
        return promise;
    }

    /**
     * promise：表示新的 promise；
     * 
     * result：表示上个（即当前 promise）处理的结果；
     * 
     * resolve、reject: 表示成功后接下来的动作，第四个表示失败后的动作
     */
    parse(promise, result, resolve, reject) {
        // 当新的 promise 和 result 引用同一个对象时，得到的结果将永远是一个状态为 pending 的新 Promise
        // 并且该新的 Promise 的状态不会被任何外部函数改变，也就是不会调用该 Promise 的resolve/reject。
        // 所以要避免这种情况。每个新的 Promise 的状态一定是 已经处理的 或者 即将被处理 的。
        // 即将被处理的含义是外部会调用该 promise 的 resolve/reject 改变该 promise 的状态。
        if (promise == result) throw new Error("chaining cycle detected");
        // result 是 Promise 则还需要进一步处理一下：
        // 这是链式顺序执行的基础，即在新 promise 中自动的处理掉 return 的 promise，以它调用 .then 是否正常运行完毕作为本次的 promise 的状态。
        if (result instanceof MyPromise) result.then(resolve, reject);
        else resolve(result);
    }

    static resolve(val) {
        // 实现 Promise.resolve, 对于 val 是 promise 实例的情况作处理
        return new MyPromise((resolve, reject) => {
            if (val instanceof MyPromise) val.then(resolve, reject);
            else resolve(val);
        })
    }

    static reject(reason) {
        // 在 Promise.reject，不用对传入值判断是否是 promise 实例
        return new MyPromise((resolve, reject) => {
            // if (reason instanceof MyPromise) reason.then(
            //     val => reject(val),
            //     val => reject(val)
            // )
            // else
            reject(reason);
        })
    }

    static all(promises) {
        // 此处可以实现 isvalid 增加对非法参数的处理
        // if (!isvalid(promises)) throw error("promises is not valid")
        let readys = [];
        // 想要等待所有的 promise 全部执行完毕，这件事情本身就是一个异步操作
        // 所以可以 new 新的 promise 来处理这个过程
        let myp = new MyPromise(
            (resolve, reject) => {
                let count = 0; // 目前遍历到第几个
                for (let promise of promises) {
                    count++;
                    // 如果 promise 状态时 pending 则调用 then 会新建 promise，
                    // 该新的 promise 将操作压入 callbacks, 等待原 promise 返回后触发 callbacks
                    let p = promise.then(() => {
                        // 调用成功函数，则压入 readys
                        readys.push(p);
                        if (readys.length === promises.length) resolve(readys);
                    }, reason => {
                        // 调用失败函数，不必处理剩余 promises
                        reject(reason + ` in promise of ${count}`);
                    });
                }
            });
        return myp;
    }
    static race(promises) {
        let myp = new MyPromise(
            (resolve, reject) => {
                for (let promise of promises) {
                    promise.then(
                        val => resolve(val),
                        reason => reject(reason)
                    )
                }
            }
        )
        return myp;
    }
}


export { MyPromise }

```
