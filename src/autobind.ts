export function autobind(
  target: any,
  key: string,
  { configurable, enumerable, set, value }: PropertyDescriptor
) {
  return {
    configurable,
    enumerable,
    // value, 这个值设置后不能设置get set
    set,
    get() {
      return value.bind(this);
    },
  };
}
