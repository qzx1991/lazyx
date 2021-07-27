export declare class XPromise {
    private promise?;
    resolve?: (v?: any) => void;
    reject?: (v?: any) => void;
    constructor();
    private init;
    wait(): Promise<any>;
}
export declare class Debounce {
    private timeout;
    private _timeSchedule;
    private _async;
    wait(): Promise<any>;
    constructor(timeout?: number);
    execute(func: () => any): Promise<any>;
}
