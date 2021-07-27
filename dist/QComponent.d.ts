import { ReactNode, Component } from 'react';
export default function QComponent(): (target: typeof LazyableComponent) => any;
export declare function OnMounted(): (target: any, key: string, descripter: PropertyDescriptor) => void;
export declare function OnUnmount(): (target: any, key: string, descripter: PropertyDescriptor) => void;
export declare function OnUpdated(): (target: any, key: string, descripter: PropertyDescriptor) => void;
export declare function OnReceiveProps(): (target: any, key: string, descripter: PropertyDescriptor) => void;
export declare function ShuoldUpdate(): (target: any, key: string, descripter: PropertyDescriptor) => void;
export declare type IClassNamesTypes = string | undefined | (string | undefined | {
    [prop: string]: boolean;
})[] | {
    [prop: string]: boolean;
};
export declare function className(classname: IClassNamesTypes): string | undefined;
export declare function classNames(...classnames: IClassNamesTypes[]): string | undefined;
export declare class LazyableComponent extends Component<{
    render: () => ReactNode;
}> {
    mounted: (() => void | (() => void) | Promise<void | (() => void)>)[];
    unmount: (() => void)[];
    ctx?: FunctionContextType<{}, {}, {}, {}> & MyContenxt;
    didMount(): Promise<() => void>;
    componentWillUnmount(): void;
    render(): any;
}
declare type MyContenxt = {};
export declare type ComputedType<T> = T extends Record<string, any> ? {
    [p in keyof T]: ReturnType<T[p]>;
} : T;
export declare type ServiceType<T> = T extends Record<string, new (...args: any[]) => any> ? {
    [p in keyof T]: InstanceType<T[p]>;
} : T;
export declare type FunctionContextType<T, C, S, M> = M & {
    state: T;
    computed: ComputedType<C>;
    inject: ServiceType<S>;
};
export declare type FunctionalComponentConfig<T extends {
    [prop: string]: any;
}, C extends {
    [prop: string]: any;
}, S extends Record<string, new (...args: any[]) => any>, M extends Record<string, (...args: any[]) => any>, E = {}> = {
    state?: T;
    DidMount?: (this: FunctionContextType<T, C, S, M> & E) => void | (() => void) | Promise<void | (() => void)>;
    WillUnMount?: (this: FunctionContextType<T, C, S, M> & E) => any;
    computed?: C & ThisType<FunctionContextType<T, C, S, M> & E>;
    inject?: S & ThisType<FunctionContextType<T, C, S, M> & E>;
    methods?: M & ThisType<FunctionContextType<T, C, S, M> & E>;
};
export declare function useLazyable<T, C, S, M>(option: FunctionalComponentConfig<T, C, S extends Record<string, new (...args: any[]) => any> ? S : {}, M extends Record<string, (...args: any[]) => any> ? M : {}, MyContenxt>): FunctionContextType<T, C, S, M> & MyContenxt;
export declare function OhMyGod(render: () => ReactNode): JSX.Element;
export {};
