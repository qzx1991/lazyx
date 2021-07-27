export declare function autobind(target: any, key: string, { configurable, enumerable, set, value }: PropertyDescriptor): {
    configurable: boolean | undefined;
    enumerable: boolean | undefined;
    set: ((v: any) => void) | undefined;
    get(): any;
};
