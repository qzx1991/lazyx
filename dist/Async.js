"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Debounce = exports.XPromise = void 0;
class XPromise {
    constructor() {
        this.init();
    }
    init() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = (p) => {
                resolve(p);
                return p;
            };
            this.reject = reject;
        });
    }
    async wait() {
        return this.promise;
    }
}
exports.XPromise = XPromise;
class Debounce {
    constructor(timeout = 50) {
        this.timeout = timeout;
        this._timeSchedule = null;
        this._async = new XPromise();
    }
    wait() {
        return this._async.wait();
    }
    async execute(func) {
        clearTimeout(this._timeSchedule);
        this._timeSchedule = setTimeout(async () => {
            var _a, _b;
            const promise = func();
            this._async.wait().then(() => (this._async = new XPromise()));
            if (promise && promise.catch) {
                promise.catch((e) => { var _a, _b; return (_b = (_a = this._async).reject) === null || _b === void 0 ? void 0 : _b.call(_a, e); });
            }
            (_b = (_a = this._async).resolve) === null || _b === void 0 ? void 0 : _b.call(_a, await promise);
        }, this.timeout);
        return this._async.wait();
    }
}
exports.Debounce = Debounce;
