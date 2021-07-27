# 响应式 React 小框架

## 做什么的

让 React 的更新变的响应化、自动化，不需要开发过多的去控制。

> 可以理解成 React 版本的 Vue,谁让 Vue 写起来这么舒服。

## 为什么

1. 手动的 setState 是在是麻烦
2. Mobx 虽然也是响应式，实在感觉有点麻烦(有点复杂)。
3. hooks 也是个大坑(有的地方反直觉，尽管能理解)

## 怎么用

### 简单使用

```tsx
import { LazyableComponent, useLazyable } from 'qzx-lazyx';
function Test() {
  return (
    <LazyableComponent
      render={(
        ctx = useLazyable({
          state: {
            count: 1,
          },
          methods: {
            add() {
              this.state.count++;
            },
          },
        })
      ) => <div onClick={ctx.add}>{ctx.state.count}</div>}
    />
  );
}
```

上面就是一个简单的函数组件的定义了，你可以定义属于自己的状态，操作函数等。

上面的代码我们做了：

1. 将 state 的数据变得可监测。
2. 可以使用 ctx 去访问 state
3. methods 的属性被解构出来了，放在了 ctx 中，作为 ctx 的属性
4. 函数不需要再去手动绑定了，已经帮你绑定好。

**注意**

> methods 中的方法不可以是箭头函数，否则不可以用 this 了。

### 钩子函数

为了不引入太多的概念，这里提供了两个简单的钩子，一点儿也不复杂:

1. DidMount

   组件挂载后执行，同 `Component` 的 `componentDidMount`

   > 该函数可以返回一个函数(可以是 Promise)，这个函数会在组件被销毁时调用，同 useEffect

2. WillUnMount
   组件卸载前调用，同 `Component`的 `ComponentWillUnmount`

   > 该函数会执行 DidMount 中返回的函数

### 可计算属性

Vue 中的可计算属性是在是个好东西，这里我们借鉴一下~~

```tsx
import { LazyableComponent, useLazyable } from 'qzx-lazyx';
function Test() {
  return (
    <LazyableComponent
      render={(
        ctx = useLazyable({
          state: {
            count: 1,
          },
          computed: {
            count1() {
              return this.state.counnt;
            },
          },
          methods: {
            add() {
              this.state.count++;
            },
          },
        })
      ) => <div onClick={ctx.add}>{ctx.computed.count1}</div>}
    />
  );
}
```

如上所示，我展示的是`count1`,`count1`是一个基于`count`的计算值，当`count`变化时会自动变化。

### 依赖注入

你是不是被 Context 搞得烦死了，Context，说白了，其实还是个单例。因此呢，我们可以使用全局的单例。

#### 定义单例

**单例 A**

```tsx
import { Injectable } from 'qzx-ioc';
@Injectable()
export class A {
  a = 1;
}
```

**单例 B**

```tsx
import { Injectable } from 'qzx-ioc';
import { A } from './A';
@Injectable()
export class B {
  constructor(private a: A) {}
  add() {
    this.a.a++;
  }
}
```

如上，我定义了两个类，一般来讲，当我们使用一个类的时候，我们总是会用`new` 去实例化这个类，每个实例互不相同，且互相不影响。

不过对于单例而言，我们不希望这样，我们希望的是在任何地方都用的是同一个实例。

**获取实例**

```tsx
import { Ioc } from 'qzx-ioc';
const a = Ioc(A);
const b = Ioc(B);
console.log(a.a, b.a.a); // 1  1
a.a++;
console.log(a.a, b.a.a); // 2 2
b.add();
console.log(a.a, b.a.a); // 3 3
```

#### 在 qzx-lazyx 中使用单例

```tsx
import { LazyableComponent, useLazyable } from 'qzx-lazyx';
function A() {
  return (
    <LazyableComponent
      render={(
        ctx = useLazyable({
          inject: {
            b: B,
          },
        })
      ) => <div onClick={() => ctx.inject.b.add()}>{ctx.inject.b.a.a}</div>}
    />
  );
}
```

**注意:**
这里的方法不是在`methods`中的，注意指向问题。

如上，使用`inject`属性，就可以使用你想使用的单例了(被 Injectable 注解过的类)。

> 为了不引入过多的概念，所有的单例都是可以被监听的，(通过 proxy 实现)

### OhMyGod

有时，甚至会觉得，用一个组件也很麻烦，这时你可以用`OhMyGod`,他的功能和`LazyableComponent`一模一样，只不过函数化而已。

```tsx
import { OhMyGod, useLazyable } from 'qzx-lazyx';
function A() {
  return OhMyGod((ctx=useLazyable(
    state: {count: 1},
    methods: {add() {this.state.count++}}
  )) => <div onClick={ctx.add}>{ctx.state.count}</div>)
}
```

### 局部渲染

有的时候，你不小心写了个大组件，一个小小的数据变化，可能都会导致整个组件重新渲染，你是不是会很心疼。这个时候其实你是可以用我们的组件或者函数去让它局部渲染的。

```tsx
import { LazyableComponent, useLazyable } from 'qzx-lazyx';
function Test() {
  return (
    <LazyableComponent
      render={(
        ctx = useLazyable({
          state: {
            count: 1,
          },
          computed: {
            count1() {
              return this.state.counnt;
            },
          },
          methods: {
            add() {
              this.state.count++;
            },
          },
        })
      ) => <div>
      {some large thing}
      {
        OhMyGod(() => <div onClick={ctx.add}>{ctx.computed.count1}</div>)
      }
      {some large thing too}
      </div>}
    />
  );
}
```

如上所示，当你在一个小组件上了`OhMyGod`或者`LazyableComponent`后，这个组件所关联的数据若是变化了，就只会在这个局部重新渲染，而不会导致外层大组件重新渲染。

#### 为什么可以局部渲染

每个用`OhMyGod`和`LazyableComponent`定义的组件，我们都会记录他在渲染的时候所依赖的对象和属性。 当属性和对象发生变化了，这些组件就会自动更新。
