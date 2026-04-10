import type { InjectableMeta } from "../decorators/injectable.js";
import type { Constructor } from "../utils/constructor.js";

const INJECTABLE_META = Symbol("tsinject:injectable");
const PARAMS_META = Symbol("tsinject:params");
const OPTIONAL_PARAMS = Symbol("tsinject:optional");
const PROP_INJECTIONS = Symbol("tsinject:props");
const LAZY_PROPS = Symbol("tsinject:lazy");
const POST_CONSTRUCT = Symbol("tsinject:postConstruct");
const PRE_DESTROY = Symbol("tsinject:preDestroy");

export class MetadataRegistry {
  private static injectableData = new WeakMap<
    Constructor<unknown>,
    InjectableMeta
  >();
  private static paramTokens = new WeakMap<
    Constructor<unknown>,
    Map<number, unknown>
  >();
  private static optionalParams = new WeakMap<
    Constructor<unknown>,
    Set<number>
  >();
  private static propInjections = new WeakMap<
    Constructor<unknown>,
    Map<string | symbol, unknown>
  >();
  private static lazyProps = new WeakMap<
    Constructor<unknown>,
    Set<string | symbol>
  >();
  private static postConstructMethods = new WeakMap<
    Constructor<unknown>,
    string | symbol
  >();
  private static preDestroyMethods = new WeakMap<
    Constructor<unknown>,
    string | symbol
  >();
  private static reflectMode = false;

  static registerInjectable(
    cls: Constructor<unknown>,
    meta: InjectableMeta,
  ): void {
    MetadataRegistry.injectableData.set(cls, meta);
  }

  static registerParamToken(
    cls: Constructor<unknown>,
    index: number,
    token: unknown,
  ): void {
    let map = MetadataRegistry.paramTokens.get(cls);
    if (!map) {
      map = new Map();
      MetadataRegistry.paramTokens.set(cls, map);
    }
    map.set(index, token);
  }

  static registerOptional(cls: Constructor<unknown>, index: number): void {
    let set = MetadataRegistry.optionalParams.get(cls);
    if (!set) {
      set = new Set();
      MetadataRegistry.optionalParams.set(cls, set);
    }
    set.add(index);
  }

  static registerPropertyInjection(
    cls: Constructor<unknown>,
    prop: string | symbol,
    token: unknown,
  ): void {
    let map = MetadataRegistry.propInjections.get(cls);
    if (!map) {
      map = new Map();
      MetadataRegistry.propInjections.set(cls, map);
    }
    map.set(prop, token);
  }

  static markLazyProperty(
    cls: Constructor<unknown>,
    prop: string | symbol,
  ): void {
    let set = MetadataRegistry.lazyProps.get(cls);
    if (!set) {
      set = new Set();
      MetadataRegistry.lazyProps.set(cls, set);
    }
    set.add(prop);
  }

  static isLazyProperty(
    cls: Constructor<unknown>,
    prop: string | symbol,
  ): boolean {
    return MetadataRegistry.lazyProps.get(cls)?.has(prop) ?? false;
  }

  static registerPostConstruct(
    cls: Constructor<unknown>,
    method: string | symbol,
  ): void {
    MetadataRegistry.postConstructMethods.set(cls, method);
  }

  static registerPreDestroy(
    cls: Constructor<unknown>,
    method: string | symbol,
  ): void {
    MetadataRegistry.preDestroyMethods.set(cls, method);
  }

  static getInjectable(cls: Constructor<unknown>): InjectableMeta | undefined {
    return MetadataRegistry.injectableData.get(cls);
  }

  static getParamTokens(cls: Constructor<unknown>): Map<number, unknown> {
    return MetadataRegistry.paramTokens.get(cls) ?? new Map();
  }

  static getOptionalParams(cls: Constructor<unknown>): Set<number> {
    return MetadataRegistry.optionalParams.get(cls) ?? new Set();
  }

  static getPropertyInjections(
    cls: Constructor<unknown>,
  ): Map<string | symbol, unknown> {
    return MetadataRegistry.propInjections.get(cls) ?? new Map();
  }

  static getPostConstruct(
    cls: Constructor<unknown>,
  ): string | symbol | undefined {
    return MetadataRegistry.postConstructMethods.get(cls);
  }

  static getPreDestroy(cls: Constructor<unknown>): string | symbol | undefined {
    return MetadataRegistry.preDestroyMethods.get(cls);
  }

  static setReflectMode(enabled: boolean): void {
    MetadataRegistry.reflectMode = enabled;
  }

  static isReflectMode(): boolean {
    return MetadataRegistry.reflectMode;
  }
}
