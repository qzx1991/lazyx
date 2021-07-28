import { AddGlobalIocHandler, Ioc } from 'qzx-ioc';
import React, { ReactNode, Component } from 'react';
import { Debounce } from './Async';
import { Stateable, onLazyable, Lazyable, Raw } from './Lazyable';
import { LazyTask } from './LazyTask';

const UNMOUNT_REMOVE_EVENT = Symbol('UNMOUNT_REMOVE_EVENT');
let RUNNING_COMPONENT_INSTANCE: LazyableComponent | null = null;
// 组件的依赖情况 记录组件依赖哪些对象的哪些属性
const ComponentRelyMap = new Map<LazyableComponent, Map<any, Set<string>>>();
// 对象的依赖情况 记录对象的属性被哪些组件所依赖
const TargetRelyMap = new Map<any, Map<string, Set<LazyableComponent>>>();

onLazyable('get', (t, k, v) => {
  if (RUNNING_COMPONENT_INSTANCE) {
    addRely(RUNNING_COMPONENT_INSTANCE, t, k as string);
  }
});
onLazyable('set', (t, k, v, ov, isAdd) => updateComponents(t, k as string));
onLazyable('delete', (t, k, ov) => updateComponents(t, k as string));

async function updateComponents(target: any, key: string) {
  const instances = TargetRelyMap.get(target)?.get(key);
  if (instances && instances.size > 0) {
    await Promise.all(Array.from(instances).map((i) => i.forceUpdate()));
  }
  nextTicks.forEach((n) => typeof n === 'function' && n());
  nextTicks = [];
}

let nextTicks: (() => any)[] = [];
export function nextTick(h: () => any) {
  nextTicks.push(h);
}

function runWithRecord<T>(instance: LazyableComponent, h: () => T) {
  const lastRunningInstance = RUNNING_COMPONENT_INSTANCE;
  RUNNING_COMPONENT_INSTANCE = instance;
  const result = h();
  RUNNING_COMPONENT_INSTANCE = lastRunningInstance;
  return result;
}

function addRely(instance: LazyableComponent, target: any, key: string) {
  // 记录组件依赖的对象
  if (!ComponentRelyMap.has(instance)) {
    ComponentRelyMap.set(instance, new Map());
  }
  if (!ComponentRelyMap.get(instance)?.has(target)) {
    ComponentRelyMap.get(instance)?.set(target, new Set());
  }
  const keyset = ComponentRelyMap.get(instance)?.get(target)!;
  keyset.add(key);
  // 记录对象依赖的组件
  if (!TargetRelyMap.has(target)) {
    TargetRelyMap.set(target, new Map());
  }
  if (!TargetRelyMap.get(target)?.has(key)) {
    TargetRelyMap.get(target)?.set(key, new Set());
  }
  const instanceSet = TargetRelyMap.get(target)?.get(key)!;
  instanceSet.add(instance);
}
function removeRely(instance: LazyableComponent) {
  const targetRely = ComponentRelyMap.get(instance);
  ComponentRelyMap.delete(instance);
  targetRely?.forEach((reliedKeys, target) => {
    const map = TargetRelyMap.get(target);
    if (map) {
      reliedKeys.forEach((key) => {
        const instances = map.get(key);
        instances?.delete(instance);
        if (instances?.size === 0) map.delete(key);
      });
      if (map.size === 0) TargetRelyMap.delete(target);
    }
  });
}

export default function QComponent() {
  return (target: typeof LazyableComponent) => {
    const instanceDebounceStore = new Map<Component, Debounce>();
    // 设置卸载时的一些操作
    const componentWillUnmount = target.prototype.componentWillUnmount;
    target.prototype.componentWillUnmount = function () {
      instanceDebounceStore.delete(this);
      removeRely(this);
      (this as any)[UNMOUNT_REMOVE_EVENT]?.forEach(
        (h: () => void) => typeof h === 'function' && h()
      );
      (this as any)[UNMOUNT_REMOVE_EVENT] = [];
      if (componentWillUnmount) {
        componentWillUnmount.apply(this, arguments as any);
      }
    };
    // 设置渲染时的操作
    const rawRender = target.prototype.render;
    target.prototype.render = function () {
      return runWithRecord(this, () => rawRender.apply(this));
    };

    // 强制渲染的逻辑  forceupdate
    const rawForceUpdate = target.prototype.forceUpdate;
    target.prototype.forceUpdate = function () {
      if (!instanceDebounceStore.has(this)) {
        instanceDebounceStore.set(this, new Debounce(50));
      }
      const debounce = instanceDebounceStore.get(this);
      return debounce
        ? debounce.execute(
            () =>
              ComponentRelyMap.has(this) &&
              rawForceUpdate.apply(this, arguments as any)
          )
        : rawForceUpdate.apply(this, arguments as any);
    };
    return Stateable()(target);
  };
}

export function OnMounted() {
  return (target: any, key: string, descripter: PropertyDescriptor) => {
    const func = target.componentDidMount;
    target['componentDidMount'] = async function (...args: any[]) {
      const res1 = func && (await func.apply(this, args));
      const res2 = await descripter.value?.apply(this, args);
      if (!this[UNMOUNT_REMOVE_EVENT]) {
        this[UNMOUNT_REMOVE_EVENT] = [];
      }
      this[UNMOUNT_REMOVE_EVENT].push(() => {
        typeof res1 === 'function' && res1();
        typeof res2 === 'function' && res2();
      });
    };
  };
}

export function OnUnmount() {
  return (target: any, key: string, descripter: PropertyDescriptor) => {
    const func = target.componentWillUnmount;
    target['componentWillUnmount'] = async function (...args: any[]) {
      func && (await func.apply(this, args));
      return descripter.value.apply(this, args);
    };
  };
}

export function OnUpdated() {
  return (target: any, key: string, descripter: PropertyDescriptor) => {
    const func = target.componentDidUpdate;
    target['componentDidUpdate'] = async function (...args: any[]) {
      func && (await func.apply(this, args));
      return descripter.value.apply(this, args);
    };
  };
}

export function OnReceiveProps() {
  return (target: any, key: string, descripter: PropertyDescriptor) => {
    const func = target.UNSAFE_componentWillReceiveProps;
    target['UNSAFE_componentWillReceiveProps'] = async function (
      ...args: any[]
    ) {
      func && (await func.apply(this, args));
      return descripter.value.apply(this, args);
    };
  };
}

/**
 * 被标记的方法会存放上一个条件的结果，自行去判断是否更新
 */
export function ShuoldUpdate() {
  return (target: any, key: string, descripter: PropertyDescriptor) => {
    const func =
      target.shouldComponentUpdate ||
      function (nextProps: any, props: any) {
        return Object.keys(nextProps).some(
          (key) => nextProps[key] !== props[key]
        );
      };
    // 我们这里不需要状态了 单反用到这个指令的都不传state
    target['shouldComponentUpdate'] = function (
      nextProps: any,
      preStatus?: boolean
    ) {
      return descripter.value.apply(this, [
        nextProps,
        func.apply(this, [nextProps, preStatus]),
      ]);
    };
  };
}

AddGlobalIocHandler((v) => Lazyable(v));

export type IClassNamesTypes =
  | string
  | undefined
  | (string | undefined | { [prop: string]: boolean })[]
  | { [prop: string]: boolean };

export function className(classname: IClassNamesTypes): string | undefined {
  if (!classname) return;
  if (typeof classname === 'string') {
    return classname;
  }
  if (Array.isArray(classname)) {
    return classname
      .map(className)
      .filter((c) => c)
      .join(' ');
  }
  return className(
    Object.keys(classname)
      .filter((prop) => classname[prop])
      .map((prop) => prop)
  );
}

export function classNames(
  ...classnames: IClassNamesTypes[]
): string | undefined {
  return className(classnames.map(className));
}

@QComponent()
export class LazyableComponent extends Component<{
  render: () => ReactNode;
}> {
  //
  mounted: (() => void | (() => void) | Promise<void | (() => void)>)[] = [];
  unmount: (() => void)[] = [];

  private nextticks: (() => any)[] = [];
  nexttick(h: () => any) {
    this.nextticks.push(h);
  }

  forceUpdate(callback?: () => void) {
    super.forceUpdate(() => {
      callback?.();
      this.nextticks.forEach((n) => n());
      this.nextticks = [];
    });
  }

  ctx?: FunctionContextType<{}, {}, {}, {}> & MyContenxt = undefined;

  @OnMounted()
  async didMount() {
    const result = await Promise.all(this.mounted.map((mount) => mount()));
    return () => result.forEach((h) => typeof h === 'function' && h());
  }

  componentWillUnmount() {
    this.unmount.forEach((unmount) => unmount());
  }
  render() {
    return (this.props.render as any)(this.ctx!);
  }
}

// 所有组件都有的公共服务

type MyContenxt = {};

export type ComputedType<T> = T extends Record<string, any>
  ? {
      [p in keyof T]: ReturnType<T[p]>;
    }
  : T;

export type ServiceType<T> = T extends Record<
  string,
  new (...args: any[]) => any
>
  ? {
      [p in keyof T]: InstanceType<T[p]>;
    }
  : T;

export type FunctionContextType<T, C, S, M> = M & {
  state: T;
  computed: ComputedType<C>;
  inject: ServiceType<S>;
  nexttick: (h: () => void) => void;
};

export type FunctionalComponentConfig<
  T extends { [prop: string]: any },
  C extends { [prop: string]: any },
  S extends Record<string, new (...args: any[]) => any>,
  M extends Record<string, (...args: any[]) => any>,
  E = {}
> = {
  state?: T;
  computed?: C & ThisType<FunctionContextType<T, C, S, M> & E>;
  inject?: S & ThisType<FunctionContextType<T, C, S, M> & E>;
  methods?: M & ThisType<FunctionContextType<T, C, S, M> & E>;
  DidMount?: (
    this: FunctionContextType<T, C, S, M> & E
  ) => void | (() => void) | Promise<void | (() => void)>;
  WillUnMount?: (this: FunctionContextType<T, C, S, M> & E) => any;
};

export function useLazyable<T, C, S, M>(
  option: FunctionalComponentConfig<
    T,
    C,
    S extends Record<string, new (...args: any[]) => any> ? S : {},
    M extends Record<string, (...args: any[]) => any> ? M : {},
    MyContenxt
  >
): FunctionContextType<T, C, S, M> & MyContenxt {
  if (!RUNNING_COMPONENT_INSTANCE) {
    throw new Error('you are not in an render function');
  }
  const instance = RUNNING_COMPONENT_INSTANCE;
  const ctx: FunctionContextType<T, C, S, M> & MyContenxt = {
    nexttick(h: () => any) {
      instance.nexttick(h);
    },
  } as any;
  option?.DidMount &&
    typeof option.DidMount === 'function' &&
    instance.mounted.push(option.DidMount.bind(ctx as any));
  option?.WillUnMount &&
    typeof option.WillUnMount === 'function' &&
    instance.unmount.push(option.WillUnMount.bind(ctx as any));
  const state = (option.state && Lazyable(option.state as any)) || ({} as T);
  const inject: ServiceType<S> = {} as any;
  const _computed = Lazyable({} as any);
  const computed = new Proxy(_computed, {
    get(t, k, r) {
      // 已经有这个属性了 直接用
      if (Raw(t).hasOwnProperty(k)) {
        return Reflect.get(t, k, r);
      } else {
        const task = new LazyTask(
          () => {
            _computed[k] = (option?.computed as any)?.[k as string]?.apply(ctx);
          },
          {
            autoAppendAsSubTask: false,
          }
        );
        // 卸载的时候 解除监听
        instance.unmount.push(() => task.stop());
        return Reflect.get(t, k, r);
      }
    },
    set() {
      throw new Error("computed value can't be set");
    },
  });
  ctx.state = state;
  ctx.computed = computed;
  ctx.inject = inject;
  instance.ctx = ctx;
  if (option.inject) {
    const rawInject = Raw(option.inject);
    for (let i in rawInject) {
      const service = rawInject[i];
      const ins = Ioc(service as any);
      (inject as any)[i] = ins;
    }
  }
  for (let i in option.methods) {
    (ctx as any)[i] = (option.methods[i] as any).bind(ctx);
  }
  return ctx as any;
}

export function OhMyGod(render: () => ReactNode) {
  return <LazyableComponent render={render} />;
}

<LazyableComponent
  render={(
    ctx = useLazyable({
      state: { count: 1 },
      computed: {
        c() {
          return this.state.count;
        },
      },
      methods: {
        a() {
          return this.state.count;
        },
      },
      WillUnMount() {},
    })
  ) => <div>lkmlkm</div>}
/>;
