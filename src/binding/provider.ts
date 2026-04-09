import type { ResolutionContext } from "../context/resolution-context.js";
import type { Token } from "../token/token.js";
import type { Constructor } from "../utils/constructor.js";

export interface ClassProvider<T> {
  readonly type: "class";
  readonly useClass: Constructor<T>;
}

export interface FactoryProvider<T> {
  readonly type: "factory";
  readonly useFactory: (ctx: ResolutionContext) => T | Promise<T>;
  readonly inject?: readonly Token<unknown>[];
}

export interface ValueProvider<T> {
  readonly type: "value";
  readonly useValue: T;
}

export interface AliasProvider<T> {
  readonly type: "alias";
  readonly useToken: Token<T>;
}

export type Provider<T> =
  | ClassProvider<T>
  | FactoryProvider<T>
  | ValueProvider<T>
  | AliasProvider<T>;
