"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OhMyGod = exports.useLazyable = exports.LazyableComponent = exports.classNames = exports.className = exports.ShuoldUpdate = exports.OnReceiveProps = exports.OnUpdated = exports.OnUnmount = exports.OnMounted = void 0;
const tslib_1 = require("tslib");
const qzx_ioc_1 = require("qzx-ioc");
const react_1 = tslib_1.__importStar(require("react"));
const Async_1 = require("./Async");
const Lazyable_1 = require("./Lazyable");
const LazyTask_1 = require("./LazyTask");
const UNMOUNT_REMOVE_EVENT = Symbol('UNMOUNT_REMOVE_EVENT');
let RUNNING_COMPONENT_INSTANCE = null;
const ComponentRelyMap = new Map();
const TargetRelyMap = new Map();
Lazyable_1.onLazyable('get', (t, k, v) => {
    if (RUNNING_COMPONENT_INSTANCE) {
        addRely(RUNNING_COMPONENT_INSTANCE, t, k);
    }
});
Lazyable_1.onLazyable('set', (t, k, v, ov, isAdd) => {
    var _a, _b;
    (_b = (_a = TargetRelyMap.get(t)) === null || _a === void 0 ? void 0 : _a.get(k)) === null || _b === void 0 ? void 0 : _b.forEach((instance) => instance.forceUpdate());
});
Lazyable_1.onLazyable('delete', (t, k, ov) => {
    var _a, _b;
    (_b = (_a = TargetRelyMap.get(t)) === null || _a === void 0 ? void 0 : _a.get(k)) === null || _b === void 0 ? void 0 : _b.forEach((instance) => instance.forceUpdate());
});
function runWithRecord(instance, h) {
    const lastRunningInstance = RUNNING_COMPONENT_INSTANCE;
    RUNNING_COMPONENT_INSTANCE = instance;
    const result = h();
    RUNNING_COMPONENT_INSTANCE = lastRunningInstance;
    return result;
}
function addRely(instance, target, key) {
    var _a, _b, _c, _d, _e, _f;
    if (!ComponentRelyMap.has(instance)) {
        ComponentRelyMap.set(instance, new Map());
    }
    if (!((_a = ComponentRelyMap.get(instance)) === null || _a === void 0 ? void 0 : _a.has(target))) {
        (_b = ComponentRelyMap.get(instance)) === null || _b === void 0 ? void 0 : _b.set(target, new Set());
    }
    const keyset = (_c = ComponentRelyMap.get(instance)) === null || _c === void 0 ? void 0 : _c.get(target);
    keyset.add(key);
    if (!TargetRelyMap.has(target)) {
        TargetRelyMap.set(target, new Map());
    }
    if (!((_d = TargetRelyMap.get(target)) === null || _d === void 0 ? void 0 : _d.has(key))) {
        (_e = TargetRelyMap.get(target)) === null || _e === void 0 ? void 0 : _e.set(key, new Set());
    }
    const instanceSet = (_f = TargetRelyMap.get(target)) === null || _f === void 0 ? void 0 : _f.get(key);
    instanceSet.add(instance);
}
function removeRely(instance) {
    const targetRely = ComponentRelyMap.get(instance);
    ComponentRelyMap.delete(instance);
    targetRely === null || targetRely === void 0 ? void 0 : targetRely.forEach((reliedKeys, target) => {
        const map = TargetRelyMap.get(target);
        if (map) {
            reliedKeys.forEach((key) => {
                const instances = map.get(key);
                instances === null || instances === void 0 ? void 0 : instances.delete(instance);
                if ((instances === null || instances === void 0 ? void 0 : instances.size) === 0)
                    map.delete(key);
            });
            if (map.size === 0)
                TargetRelyMap.delete(target);
        }
    });
}
function QComponent() {
    return (target) => {
        const instanceDebounceStore = new Map();
        const componentWillUnmount = target.prototype.componentWillUnmount;
        target.prototype.componentWillUnmount = function () {
            var _a;
            instanceDebounceStore.delete(this);
            removeRely(this);
            (_a = this[UNMOUNT_REMOVE_EVENT]) === null || _a === void 0 ? void 0 : _a.forEach((h) => typeof h === 'function' && h());
            this[UNMOUNT_REMOVE_EVENT] = [];
            if (componentWillUnmount) {
                componentWillUnmount.apply(this, arguments);
            }
        };
        const rawRender = target.prototype.render;
        target.prototype.render = function () {
            return runWithRecord(this, () => rawRender.apply(this));
        };
        const rawForceUpdate = target.prototype.forceUpdate;
        target.prototype.forceUpdate = function () {
            if (!instanceDebounceStore.has(this)) {
                instanceDebounceStore.set(this, new Async_1.Debounce(50));
            }
            const debounce = instanceDebounceStore.get(this);
            return debounce
                ? debounce.execute(() => rawForceUpdate.apply(this, arguments))
                : rawForceUpdate.apply(this, arguments);
        };
        return Lazyable_1.Stateable()(target);
    };
}
exports.default = QComponent;
function OnMounted() {
    return (target, key, descripter) => {
        const func = target.componentDidMount;
        target['componentDidMount'] = async function (...args) {
            var _a;
            const res1 = func && (await func.apply(this, args));
            const res2 = await ((_a = descripter.value) === null || _a === void 0 ? void 0 : _a.apply(this, args));
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
exports.OnMounted = OnMounted;
function OnUnmount() {
    return (target, key, descripter) => {
        const func = target.componentWillUnmount;
        target['componentWillUnmount'] = async function (...args) {
            func && (await func.apply(this, args));
            return descripter.value.apply(this, args);
        };
    };
}
exports.OnUnmount = OnUnmount;
function OnUpdated() {
    return (target, key, descripter) => {
        const func = target.componentDidUpdate;
        target['componentDidUpdate'] = async function (...args) {
            func && (await func.apply(this, args));
            return descripter.value.apply(this, args);
        };
    };
}
exports.OnUpdated = OnUpdated;
function OnReceiveProps() {
    return (target, key, descripter) => {
        const func = target.UNSAFE_componentWillReceiveProps;
        target['UNSAFE_componentWillReceiveProps'] = async function (...args) {
            func && (await func.apply(this, args));
            return descripter.value.apply(this, args);
        };
    };
}
exports.OnReceiveProps = OnReceiveProps;
function ShuoldUpdate() {
    return (target, key, descripter) => {
        const func = target.shouldComponentUpdate ||
            function (nextProps, props) {
                return Object.keys(nextProps).some((key) => nextProps[key] !== props[key]);
            };
        target['shouldComponentUpdate'] = function (nextProps, preStatus) {
            return descripter.value.apply(this, [
                nextProps,
                func.apply(this, [nextProps, preStatus]),
            ]);
        };
    };
}
exports.ShuoldUpdate = ShuoldUpdate;
qzx_ioc_1.AddGlobalIocHandler((v) => Lazyable_1.Lazyable(v));
function className(classname) {
    if (!classname)
        return;
    if (typeof classname === 'string') {
        return classname;
    }
    if (Array.isArray(classname)) {
        return classname
            .map(className)
            .filter((c) => c)
            .join(' ');
    }
    return className(Object.keys(classname)
        .filter((prop) => classname[prop])
        .map((prop) => prop));
}
exports.className = className;
function classNames(...classnames) {
    return className(classnames.map(className));
}
exports.classNames = classNames;
let LazyableComponent = class LazyableComponent extends react_1.Component {
    constructor() {
        super(...arguments);
        this.mounted = [];
        this.unmount = [];
        this.ctx = undefined;
    }
    async didMount() {
        const result = await Promise.all(this.mounted.map((mount) => mount()));
        return () => result.forEach((h) => typeof h === 'function' && h());
    }
    componentWillUnmount() {
        this.unmount.forEach((unmount) => unmount());
    }
    render() {
        return this.props.render(this.ctx);
    }
};
tslib_1.__decorate([
    OnMounted(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], LazyableComponent.prototype, "didMount", null);
LazyableComponent = tslib_1.__decorate([
    QComponent()
], LazyableComponent);
exports.LazyableComponent = LazyableComponent;
function useLazyable(option) {
    if (!RUNNING_COMPONENT_INSTANCE) {
        throw new Error('you are not in an render function');
    }
    const instance = RUNNING_COMPONENT_INSTANCE;
    const ctx = {};
    option.DidMount &&
        typeof option.DidMount === 'function' &&
        instance.mounted.push(option.DidMount.bind(ctx));
    option.WillUnMount &&
        typeof option.WillUnMount === 'function' &&
        instance.unmount.push(option.WillUnMount.bind(ctx));
    const state = (option.state && Lazyable_1.Lazyable(option.state)) || {};
    const inject = {};
    const _computed = Lazyable_1.Lazyable({});
    const computed = new Proxy(_computed, {
        get(t, k, r) {
            if (Lazyable_1.Raw(t).hasOwnProperty(k)) {
                return Reflect.get(t, k, r);
            }
            else {
                const task = new LazyTask_1.LazyTask(() => {
                    var _a, _b;
                    _computed[k] = (_b = (_a = option === null || option === void 0 ? void 0 : option.computed) === null || _a === void 0 ? void 0 : _a[k]) === null || _b === void 0 ? void 0 : _b.apply(ctx);
                }, {
                    autoAppendAsSubTask: false,
                });
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
        const rawInject = Lazyable_1.Raw(option.inject);
        for (let i in rawInject) {
            const service = rawInject[i];
            const ins = qzx_ioc_1.Ioc(service);
            inject[i] = ins;
        }
    }
    for (let i in option.methods) {
        ctx[i] = option.methods[i].bind(ctx);
    }
    return ctx;
}
exports.useLazyable = useLazyable;
function OhMyGod(render) {
    return react_1.default.createElement(LazyableComponent, { render: render });
}
exports.OhMyGod = OhMyGod;
