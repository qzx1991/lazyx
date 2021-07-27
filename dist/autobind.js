"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autobind = void 0;
function autobind(target, key, { configurable, enumerable, set, value }) {
    return {
        configurable,
        enumerable,
        set,
        get() {
            return value.bind(this);
        },
    };
}
exports.autobind = autobind;
