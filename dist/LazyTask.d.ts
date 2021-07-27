import { Debounce } from './Async';
import { LazyableOptType } from './Lazyable';
export interface ILazyTaskHandlerOption<T = any> {
    runTime: number;
    getTask: () => LazyTask;
    except: <K>(h: () => K) => K;
    setData: (v: T) => void;
    getData: () => T | undefined;
    lastUnsub: (isStop?: boolean) => void;
    reasons?: TaskChangeReason[];
    addSubTask: (subTask: LazyTask) => void;
    removeSubTask: (subTask: LazyTask, stop?: boolean) => void;
    stop: () => void;
    id: number;
}
export interface ILazyTaskOption {
    debounce?: number;
    autoRun?: boolean;
    maxRunTime?: number;
    autoUnsub?: boolean;
    autoAppendAsSubTask?: boolean;
    notRecord?: (t: any, k: string | number, v: any) => boolean;
}
export declare function getRunningTask(): LazyTask<any> | undefined;
export declare function runExcludeTask<T = any>(h: () => T): T;
export declare class LazyTask<T = any> {
    private handler;
    private option;
    private stopped;
    private unsub?;
    private data?;
    private time;
    id: number;
    debounce?: Debounce;
    parent?: LazyTask;
    path?: string;
    private level?;
    root: LazyTask;
    private changeReasons;
    canRecordRely: boolean;
    private stopRecordRely;
    private startRecordRely;
    private subTasks;
    constructor(handler: (option: ILazyTaskHandlerOption<T>) => void | undefined | ((isStop: boolean) => void), option?: ILazyTaskOption);
    canRecord(t: any, k: string | number, v: any): boolean;
    run(reasons?: TaskChangeReason[]): void;
    except<T = any>(h: () => T): T;
    setData(data: T): void;
    getData(): T | undefined;
    stop(fromParent?: boolean): void;
    hasStopped(): boolean;
    addReason(reasons?: TaskChangeReason[]): void;
    restart(force?: boolean): void;
    addSubTask(task: LazyTask): void;
    removeSubTask(task: LazyTask, stop?: boolean): void;
}
export declare type TaskChangeReason = {
    target: any;
    key: any;
    type: LazyableOptType;
    value: any;
    oldValue?: any;
};
export declare function Computed<T>(h: () => T): {
    value: undefined | T;
    stop: () => void;
};
export declare function cloneLazyableObject<T extends Record<string, any>>(object: T, parentTask?: LazyTask<any> | undefined): T;
