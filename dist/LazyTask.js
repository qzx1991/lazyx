"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneLazyableObject = exports.Computed = exports.LazyTask = exports.runExcludeTask = exports.getRunningTask = void 0;
const tslib_1 = require("tslib");
const Async_1 = require("./Async");
const autobind_1 = require("./autobind");
const Lazyable_1 = require("./Lazyable");
let TMEP_RUNNING_TASK;
function getRunningTask() {
    return TMEP_RUNNING_TASK;
}
exports.getRunningTask = getRunningTask;
function setRunnintTask(task) {
    TMEP_RUNNING_TASK = task;
}
function runExcludeTask(h) {
    if (TMEP_RUNNING_TASK) {
        return TMEP_RUNNING_TASK.except(() => h());
    }
    return h();
}
exports.runExcludeTask = runExcludeTask;
let id = 0;
class LazyTask {
    constructor(handler, option = {}) {
        var _a;
        this.handler = handler;
        this.option = option;
        this.stopped = false;
        this.time = 0;
        this.id = id++;
        this.changeReasons = [];
        this.canRecordRely = true;
        this.subTasks = new Set();
        const parent = getRunningTask();
        this.debounce = new Async_1.Debounce(option.debounce || 0);
        if (option.autoAppendAsSubTask ||
            option.autoAppendAsSubTask === undefined) {
            this.parent = parent;
            this.root = parent ? parent.root : this;
            this.level = parent ? parent.level + 1 : 1;
            this.path = parent ? `${parent.path}-${this.id}` : `${this.id}`;
            (_a = this.parent) === null || _a === void 0 ? void 0 : _a.addSubTask(this);
        }
        if (this.option.autoRun || this.option.autoRun === undefined) {
            this.run();
        }
    }
    stopRecordRely() {
        this.canRecordRely = false;
    }
    startRecordRely() {
        this.canRecordRely = true;
    }
    canRecord(t, k, v) {
        if (!this.canRecordRely)
            return false;
        if (!this.option.notRecord || typeof this.option.notRecord !== 'function')
            return true;
        return !this.option.notRecord(t, k, v);
    }
    run(reasons = []) {
        var _a;
        if (this.stopped) {
            throw new Error('任务已终止！');
        }
        const lastTask = getRunningTask();
        setRunnintTask(this);
        const shouldAutoUnsub = this.option.autoUnsub || this.option.autoUnsub === undefined;
        shouldAutoUnsub && ((_a = this.unsub) === null || _a === void 0 ? void 0 : _a.call(this, false));
        const lastUnsub = shouldAutoUnsub ? () => { } : () => { var _a; return (_a = this.unsub) === null || _a === void 0 ? void 0 : _a.call(this, false); };
        removeRely(this);
        this.unsub =
            this.handler({
                id: this.id,
                runTime: ++this.time,
                except: this.except,
                getData: this.getData,
                setData: this.setData,
                lastUnsub,
                getTask: () => this,
                reasons,
                addSubTask: this.addSubTask,
                removeSubTask: this.removeSubTask,
                stop: this.stop,
            }) || undefined;
        setRunnintTask(lastTask);
    }
    except(h) {
        this.stopRecordRely();
        const res = h();
        this.startRecordRely();
        return res;
    }
    setData(data) {
        this.data = data;
    }
    getData() {
        return this.data;
    }
    stop(fromParent = false) {
        var _a;
        if (!fromParent && this.parent) {
            this.parent.removeSubTask(this);
        }
        else {
            if (this.stopped)
                return;
            removeRely(this);
            this.subTasks.forEach((t) => t.stop());
            this.stopped = true;
            (_a = this.unsub) === null || _a === void 0 ? void 0 : _a.call(this, true);
            this.unsub = undefined;
            this.subTasks.clear();
            this.data = undefined;
            this.changeReasons = [];
        }
    }
    hasStopped() {
        return this.stopped;
    }
    addReason(reasons) {
        reasons === null || reasons === void 0 ? void 0 : reasons.forEach((r) => this.changeReasons.push(r));
    }
    restart(force = false) {
        if (!force && this.stopped)
            return;
        this.run(this.changeReasons);
        this.changeReasons = [];
    }
    addSubTask(task) {
        this.subTasks.add(task);
        if (task.parent !== this) {
            task.parent = this;
            task.path = `${this.path}-${task.id}`;
        }
    }
    removeSubTask(task, stop = true) {
        if (stop)
            task.stop(true);
        this.subTasks.delete(task);
    }
}
tslib_1.__decorate([
    autobind_1.autobind,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Function]),
    tslib_1.__metadata("design:returntype", void 0)
], LazyTask.prototype, "except", null);
tslib_1.__decorate([
    autobind_1.autobind,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], LazyTask.prototype, "setData", null);
tslib_1.__decorate([
    autobind_1.autobind,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], LazyTask.prototype, "getData", null);
tslib_1.__decorate([
    autobind_1.autobind,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], LazyTask.prototype, "stop", null);
tslib_1.__decorate([
    autobind_1.autobind,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [LazyTask]),
    tslib_1.__metadata("design:returntype", void 0)
], LazyTask.prototype, "addSubTask", null);
tslib_1.__decorate([
    autobind_1.autobind,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [LazyTask, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], LazyTask.prototype, "removeSubTask", null);
exports.LazyTask = LazyTask;
const TASK_TARGET_RELY = new Map();
const TARGET_TASK_RELY = new Map();
function addRely(task, t, k) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (!TASK_TARGET_RELY.has(task)) {
        TASK_TARGET_RELY.set(task, new Map());
    }
    if (!((_a = TASK_TARGET_RELY.get(task)) === null || _a === void 0 ? void 0 : _a.has(t))) {
        (_b = TASK_TARGET_RELY.get(task)) === null || _b === void 0 ? void 0 : _b.set(t, new Set());
    }
    (_d = (_c = TASK_TARGET_RELY.get(task)) === null || _c === void 0 ? void 0 : _c.get(t)) === null || _d === void 0 ? void 0 : _d.add(k);
    if (!TARGET_TASK_RELY.has(t)) {
        TARGET_TASK_RELY.set(t, new Map());
    }
    if (!((_e = TARGET_TASK_RELY.get(t)) === null || _e === void 0 ? void 0 : _e.has(k))) {
        (_f = TARGET_TASK_RELY.get(t)) === null || _f === void 0 ? void 0 : _f.set(k, new Set());
    }
    (_h = (_g = TARGET_TASK_RELY.get(t)) === null || _g === void 0 ? void 0 : _g.get(k)) === null || _h === void 0 ? void 0 : _h.add(task);
}
function removeRely(task) {
    const t = TASK_TARGET_RELY.get(task);
    TASK_TARGET_RELY.delete(task);
    t === null || t === void 0 ? void 0 : t.forEach((keys, target) => {
        keys.forEach((key) => {
            var _a, _b, _c, _d, _e, _f;
            (_b = (_a = TARGET_TASK_RELY.get(target)) === null || _a === void 0 ? void 0 : _a.get(key)) === null || _b === void 0 ? void 0 : _b.delete(task);
            if (((_d = (_c = TARGET_TASK_RELY.get(target)) === null || _c === void 0 ? void 0 : _c.get(key)) === null || _d === void 0 ? void 0 : _d.size) === 0) {
                (_e = TARGET_TASK_RELY.get(target)) === null || _e === void 0 ? void 0 : _e.delete(key);
            }
            if (((_f = TARGET_TASK_RELY.get(target)) === null || _f === void 0 ? void 0 : _f.size) === 0) {
                TARGET_TASK_RELY.delete(target);
            }
        });
    });
}
Lazyable_1.onLazyable('get', (t, k, v) => {
    if (TMEP_RUNNING_TASK &&
        TMEP_RUNNING_TASK.canRecord(t, k, v)) {
        addRely(TMEP_RUNNING_TASK, t, k);
    }
});
Lazyable_1.onLazyable('set', (t, k, v, ov, isAdd) => {
    var _a, _b;
    (_b = (_a = TARGET_TASK_RELY.get(t)) === null || _a === void 0 ? void 0 : _a.get(k)) === null || _b === void 0 ? void 0 : _b.forEach((task) => {
        var _a;
        task.addReason([
            {
                target: t,
                key: k,
                type: isAdd ? 'add' : 'set',
                value: v,
                oldValue: ov,
            },
        ]);
        (_a = task.debounce) === null || _a === void 0 ? void 0 : _a.execute(() => task.restart());
    });
});
Lazyable_1.onLazyable('delete', (t, k, ov) => {
    var _a, _b;
    (_b = (_a = TARGET_TASK_RELY.get(t)) === null || _a === void 0 ? void 0 : _a.get(k)) === null || _b === void 0 ? void 0 : _b.forEach((task) => {
        var _a;
        task.addReason([
            {
                target: t,
                key: k,
                type: 'delete',
                value: undefined,
                oldValue: ov,
            },
        ]);
        (_a = task.debounce) === null || _a === void 0 ? void 0 : _a.execute(() => task.restart());
    });
});
function Computed(h) {
    const value = {
        value: undefined,
        stop() {
            return task.stop();
        },
    };
    const task = new LazyTask((o) => {
        value.value = h();
    });
    return value;
}
exports.Computed = Computed;
function cloneLazyableObject(object, parentTask = getRunningTask()) {
    const data = Lazyable_1.Lazyable({});
    const tasks = new Map();
    let isParentSet = false;
    const task = new LazyTask((o) => {
        const unsubDelete = Lazyable_1.onLazyable('delete', object, (t, k) => {
            const task = tasks.get(k);
            if (task) {
                o.removeSubTask(task);
            }
            delete data[k];
        });
        const unsubSet = Lazyable_1.onLazyable('set', data, (t, k) => {
            if (!isParentSet && tasks.has(k)) {
                const task = tasks.get(k);
                o.removeSubTask(task);
                tasks.delete(k);
            }
        });
        const unsubAdd = Lazyable_1.onLazyable('add', object, (t, k, v) => {
            const tempTask = new LazyTask(() => {
                isParentSet = true;
                data[k] = object[k];
                isParentSet = false;
            });
            tasks.set(k, tempTask);
            o.addSubTask(tempTask);
        });
        for (let key in object) {
            const tempTask = new LazyTask(() => {
                isParentSet = true;
                data[key] = object[key];
                isParentSet = false;
            });
            tasks.set(key, tempTask);
            o.addSubTask(tempTask);
        }
        return () => {
            tasks.clear();
            unsubDelete();
            unsubAdd();
            unsubSet();
        };
    });
    if (parentTask) {
        parentTask.addSubTask(task);
    }
    return data;
}
exports.cloneLazyableObject = cloneLazyableObject;
