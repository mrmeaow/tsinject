export interface Constructor<T> {
  new (...args: unknown[]): T;
  prototype: T;
}

export type InstanceOf<C> = C extends Constructor<infer T> ? T : never;

export type ConstructorParametersOf<C> = C extends new (
  ...args: infer P
) => unknown
  ? P
  : never;
