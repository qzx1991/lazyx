"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.State = exports.Stateable = exports.STATE_FLAG = exports.onLazyable = exports.Ref = exports.Raw = exports.getLazyableRawData = exports.Lazyable = exports.transformLazyable = exports.isLazyabledData = exports.hasTargetLazyabled = exports.ORIGIN_TARGET_FLAG = exports.LAZYABLED_FLAG = exports.LAZYABLE_FLAG = void 0;
exports.LAZYABLE_FLAG = Symbol('_$$__$$__is_lazyable');
exports.LAZYABLED_FLAG = Symbol('_$$__$$__is_lazyabled');
exports.ORIGIN_TARGET_FLAG = Symbol('_$$__$$__origin_target_flag');
function hasTargetLazyabled(value) {
    var _a;
    if (!value || typeof value !== 'object')
        return false;
    const origin = getLazyableRawData(value);
    const proto = (_a = origin) === null || _a === void 0 ? void 0 : _a.__proto__;
    if (!proto || !proto[exports.LAZYABLE_FLAG])
        return false;
    return true;
}
exports.hasTargetLazyabled = hasTargetLazyabled;
function isLazyabledData(v) {
    return v && v[exports.LAZYABLED_FLAG];
}
exports.isLazyabledData = isLazyabledData;
function canKeyLazyable(k, { include, exclude } = {}) {
    if (exclude && exclude.includes(k))
        return false;
    if (include) {
        return include.includes(k);
    }
    return true;
}
const GET_HANDLERS_MAP = new Map();
const SET_HANDLERS_MAP = new Map();
const DELETE_HANDLERS_MAP = new Map();
const ADD_HANDLERS_MAP = new Map();
function getHandlersMapByType(type) {
    switch (type) {
        case 'get':
            return GET_HANDLERS_MAP;
        case 'set':
            return SET_HANDLERS_MAP;
        case 'delete':
            return DELETE_HANDLERS_MAP;
        case 'add':
            return ADD_HANDLERS_MAP;
    }
}
function onLazyableOpt(map, t = 'default', ...args) {
    var _a;
    (_a = map.get(exports.Raw(t))) === null || _a === void 0 ? void 0 : _a.forEach((h) => h(...args));
}
const LAZYABLE_GET_TRANSFORMERS = [];
function transformLazyable(h) {
    LAZYABLE_GET_TRANSFORMERS.push(h);
}
exports.transformLazyable = transformLazyable;
function Lazyable(value, opt = {}) {
    var _a;
    if (!value)
        return value;
    if (typeof value !== 'object')
        return value;
    if (hasTargetLazyabled(value))
        return (_a = getLazyableRawData(value)) === null || _a === void 0 ? void 0 : _a[exports.LAZYABLE_FLAG];
    const R = new Proxy(value, {
        get(t, k, r) {
            var _a;
            if (k === exports.ORIGIN_TARGET_FLAG)
                return t;
            if (k === exports.LAZYABLED_FLAG)
                return true;
            const v = Reflect.get(t, k, r);
            if (!canKeyLazyable(k, opt)) {
                return v;
            }
            const Rv = hasTargetLazyabled(v)
                ? (_a = getLazyableRawData(v)) === null || _a === void 0 ? void 0 : _a[exports.LAZYABLE_FLAG]
                : k !== '__proto__' &&
                    ((v === null || v === void 0 ? void 0 : v.__proto__) === [].__proto__ ||
                        (v === null || v === void 0 ? void 0 : v.__proto__) === {}.__proto__)
                    ? Lazyable(v)
                    : v;
            onLazyableOpt(GET_HANDLERS_MAP, t, t, k, Rv);
            onLazyableOpt(GET_HANDLERS_MAP, 'default', t, k, Rv);
            return LAZYABLE_GET_TRANSFORMERS.reduce((lastv, h) => h(lastv, t, k, R), Rv);
        },
        set(t, k, v, r) {
            const isAdd = !t.hasOwnProperty(k);
            const oldValue = Reflect.get(t, k);
            const res = Reflect.set(t, k, getLazyableRawData(v), r);
            onLazyableOpt(SET_HANDLERS_MAP, t, t, k, v, oldValue, isAdd);
            onLazyableOpt(SET_HANDLERS_MAP, 'default', t, k, v, oldValue, isAdd);
            if (isAdd) {
                onLazyableOpt(ADD_HANDLERS_MAP, t, t, k, v, oldValue, isAdd);
                onLazyableOpt(ADD_HANDLERS_MAP, 'default', t, k, v, oldValue, isAdd);
            }
            return res;
        },
        deleteProperty(t, p) {
            const oldValue = Reflect.get(t, p);
            const res = Reflect.deleteProperty(t, p);
            onLazyableOpt(DELETE_HANDLERS_MAP, t, t, p, oldValue);
            onLazyableOpt(DELETE_HANDLERS_MAP, 'default', t, p, oldValue);
            return res;
        },
    });
    new Proxy(value.__proto__, {
        get(t, k, v) {
            if (k === exports.LAZYABLE_FLAG)
                return R;
            return Reflect.get(t, k, v);
        },
    });
    return R;
}
exports.Lazyable = Lazyable;
function getLazyableRawData(value) {
    var _a;
    return ((_a = value) === null || _a === void 0 ? void 0 : _a[exports.ORIGIN_TARGET_FLAG]) || value;
}
exports.getLazyableRawData = getLazyableRawData;
exports.Raw = getLazyableRawData;
function Ref(value) {
    return Lazyable({ value });
}
exports.Ref = Ref;
function onLazyable(type, t, h) {
    var _a;
    if (!h) {
        const temp = t;
        t = 'default';
        h = temp;
    }
    else {
        t = exports.Raw(t);
    }
    const map = getHandlersMapByType(type);
    if (!map)
        return () => { };
    if (!map.has(t)) {
        map.set(t, new Set());
    }
    (_a = map.get(t)) === null || _a === void 0 ? void 0 : _a.add(h);
    return () => {
        var _a, _b;
        (_a = map.get(t)) === null || _a === void 0 ? void 0 : _a.delete(h);
        if (((_b = map.get(t)) === null || _b === void 0 ? void 0 : _b.size) === 0)
            map.delete(t);
    };
}
exports.onLazyable = onLazyable;
exports.STATE_FLAG = Symbol('state_flag');
function Stateable({ forceAll = false } = {}) {
    return function (target) {
        return class extends target {
            constructor(...args) {
                super(...args);
                const data = Lazyable({});
                const rawData = exports.Raw(data);
                if (forceAll) {
                    for (let p in this) {
                        rawData[p] = this[p];
                        Object.defineProperty(this, p, {
                            get() {
                                return Reflect.get(data, p);
                            },
                            set(v) {
                                return Reflect.set(data, p, v);
                            },
                        });
                    }
                    return;
                }
                const states = target.prototype[exports.STATE_FLAG] || [];
                states.forEach((p) => {
                    rawData[p] = this[p];
                    Object.defineProperty(this, p, {
                        get() {
                            return Reflect.get(data, p);
                        },
                        set(v) {
                            return Reflect.set(data, p, v);
                        },
                    });
                });
            }
        };
    };
}
exports.Stateable = Stateable;
function State() {
    return function (target, property) {
        if (!target[exports.STATE_FLAG]) {
            target[exports.STATE_FLAG] = [];
        }
        target[exports.STATE_FLAG].push(property);
    };
}
exports.State = State;
