export declare const LAZYABLE_FLAG: unique symbol;
export declare const LAZYABLED_FLAG: unique symbol;
export declare const ORIGIN_TARGET_FLAG: unique symbol;
export declare type LazyableGetHandlerType = (object: any, key: string | number | symbol, value: any) => void;
export declare type LazyableSetHandlerType = (object: any, key: string | number | symbol, value: any, oldValue: any, isAdd: boolean) => void;
export declare type LazyableDeleteHandlerType = (object: any, key: string | number | symbol, oldValue: any) => void;
export declare type LazyableAddHandlerType = (object: any, key: string | number | symbol, value: any) => void;
export declare type LazyableHandlerType = LazyableGetHandlerType | LazyableSetHandlerType | LazyableDeleteHandlerType | LazyableAddHandlerType;
export declare type LazyableOptType = 'get' | 'set' | 'add' | 'delete';
export declare function hasTargetLazyabled<T>(value: T): boolean;
export declare function isLazyabledData(v: any): boolean;
declare type LazyableKeyType = {
    include?: (string | symbol)[];
    exclude?: (string | symbol)[];
};
export declare function transformLazyable(h: (v: any, t: any, k: string | number | symbol, r?: any) => any): void;
export declare function Lazyable<T extends object>(value: T, opt?: LazyableKeyType): T;
export declare function getLazyableRawData<T>(value: T): T;
export declare const Raw: typeof getLazyableRawData;
export declare function Ref<T>(value: T): {
    value: T;
};
export declare function onLazyable(type: 'get', t: any, h: LazyableGetHandlerType): () => void;
export declare function onLazyable(type: 'get', h: LazyableGetHandlerType): () => void;
export declare function onLazyable(type: 'set', t: any, h: LazyableSetHandlerType): () => void;
export declare function onLazyable(type: 'set', h: LazyableSetHandlerType): () => void;
export declare function onLazyable(type: 'add', t: any, h: LazyableAddHandlerType): () => void;
export declare function onLazyable(type: 'add', h: LazyableAddHandlerType): () => void;
export declare function onLazyable(type: 'delete', t: any, h: LazyableDeleteHandlerType): () => void;
export declare function onLazyable(type: 'delete', h: LazyableDeleteHandlerType): () => void;
export declare const STATE_FLAG: unique symbol;
export declare function Stateable({ forceAll }?: {
    forceAll?: boolean;
}): <T extends new (...args: any[]) => any>(target: T) => any;
export declare function State(): (target: any, property: string) => void;
export {};
