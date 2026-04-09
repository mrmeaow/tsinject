# tsneedle — Architecture Blueprint (Revised)

> **"A sharp, modern dependency injection needle for TypeScript."**

---

## 0. Decisions Locked In

| Decision | Choice |
|---|---|
| Package name | **`tsneedle`** |
| Module format | **ESM + CJS** — ESM primary (`"exports"`), CJS via `"main"` / `dist/index.cjs` for legacy consumers |
| TypeScript minimum | **≥ 5.2** (Stage 3 decorators, `Symbol.metadata`) |
| Package manager | **pnpm** |
| Type safety | **Strict branded tokens, zero `any` escapes, compile-time inference** |
| `reflect-metadata` | **Never required** — opt-in sub-export, never in core path |
| Scope of this project | **Only the DI container** — no framework adapters, no web framework code |
| External deps | **Zero** on core path |

---

## 1. Name & Identity

**`tsneedle`**

```
npm install tsneedle
```

```typescript
import { Container, createToken, injectable, inject, singleton } from 'tsneedle';
```

The metaphor: a **needle** performs injection — precise, lightweight, sharp. The `ts` prefix signals its TypeScript-first, type-strict nature.

---

## 2. Type System Architecture

This is the **most critical section**. Every public API must be fully typed with zero `any` escapes. If the user sees a type error, it should tell them exactly what's wrong.

### 2.1 Branded Token System

```typescript
// ─── src/token/token.ts ───

// Phantom brands prevent accidental token confusion at compile time
const __token_brand: unique symbol = Symbol('tsneedle/token');
const __token_type: unique symbol = Symbol('tsneedle/type');

interface Token<T> {
  readonly [__token_brand]: typeof __token_brand;
  readonly [__token_type]: T;   // phantom — erased at runtime
  readonly name: string;
  readonly key: symbol;
}

function createToken<T>(name: string): Token<T> {
  const key = Symbol(`tsneedle:${name}`);
  return Object.freeze({
    [__token_brand]: __token_brand,
    [__token_type]: null as unknown as T,
    name,
    key,
  } satisfies Token<T>);
}
```

**Why branded?** Two tokens with the same string name but different types are **never interchangeable**:

```typescript
const IRepo = createToken<IRepo>('Repository');
const ICache = createToken<ICache>('Repository'); // same string, different type

container.resolve(IRepo); // ✅ returns IRepo
container.resolve(ICache); // ✅ returns ICache
// container.resolve('Repository'); // ❌ string is not a Token — no untyped access
```

### 2.2 Constructor Type Extraction

```typescript
// ─── src/utils/constructor.ts ───

// The core constructor type — captures parameter types
interface Constructor<T> {
  new (...args: any[]): T;
  prototype: T;
}

// Extract the type from a constructor
type InstanceOf<C> = C extends Constructor<infer T> ? T : never;

// Extract constructor parameter types (used internally for validation)
type ConstructorParametersOf<C> = C extends new (...args: infer P) => any ? P : never;
```

### 2.3 Provider Type Discrimination

```typescript
// ─── src/binding/provider.ts ───

interface ClassProvider<T> {
  readonly type: 'class';
  readonly useClass: Constructor<T>;
}

interface FactoryProvider<T> {
  readonly type: 'factory';
  readonly useFactory: (ctx: ResolutionContext) => T | Promise<T>;
  readonly inject?: readonly Token<any>[];  // explicit deps for factory
}

interface ValueProvider<T> {
  readonly type: 'value';
  readonly useValue: T;
}

interface AliasProvider<T> {
  readonly type: 'alias';
  readonly useToken: Token<T>;
}

type Provider<T> =
  | ClassProvider<T>
  | FactoryProvider<T>
  | ValueProvider<T>
  | AliasProvider<T>;
```

The `type` discriminant means **no ambiguity** — `switch(p.type)` is fully typed, and the user gets autocomplete.

### 2.4 Container Method Signatures (Full Type Safety)

```typescript
class Container {
  // ─── Registration ───

  // Register with a provider — token type must match provider type
  register<T>(token: Token<T>, provider: Provider<T>, options?: RegisterOptions): void;

  // Register a class directly — class must implement token's type
  registerClass<T>(token: Token<T>, cls: Constructor<T>, options?: RegisterOptions): void;

  // Register a factory — return type must match token's type
  registerFactory<T>(
    token: Token<T>,
    factory: (ctx: ResolutionContext) => T | Promise<T>,
    options?: RegisterOptions
  ): void;

  // Register a singleton class shorthand
  registerSingleton<T>(token: Token<T>, cls: Constructor<T>): void;

  // Register a value directly
  registerValue<T>(token: Token<T>, value: T): void;

  // ─── Resolution ───

  // Sync resolution — throws if factory is async or dependency is async
  resolve<T>(token: Token<T>): T;

  // Async resolution — always safe
  resolveAsync<T>(token: Token<T>): Promise<T>;

  // Nullable resolution — returns undefined if not registered
  tryResolve<T>(token: Token<T>): T | undefined;
  tryResolveAsync<T>(token: Token<T>): Promise<T | undefined>;

  // ─── Introspection ───

  has(token: Token<any>): boolean;
  hasAsync(token: Token<any>): boolean;  // checks if any async factory in graph
}
```

### 2.5 RegisterOptions

```typescript
interface RegisterOptions {
  readonly lifecycle?: Lifecycle;
  readonly tags?: readonly string[];
  readonly dispose?: (instance: any) => Promise<void> | void;
}

enum Lifecycle {
  Singleton = 'singleton',
  Transient  = 'transient',
  Scoped     = 'scoped',
}
```

### 2.6 ResolutionContext (Passed to Factories)

```typescript
interface ResolutionContext {
  resolve<T>(token: Token<T>): T;
  resolveAsync<T>(token: Token<T>): Promise<T>;
  tryResolve<T>(token: Token<T>): T | undefined;
  readonly container: Container;
  readonly scope: Container;       // the scope this resolution started in
  readonly tags: ReadonlySet<string>;
}
```

---

## 3. Decorator API

### 3.1 All Decorators (Stage 3 Only)

```typescript
// Class decorators
@injectable()                                  // mark as injectable, transient
@injectable({ lifecycle: Lifecycle.Singleton }) // mark as injectable, singleton
@singleton()                                    // shorthand

// Constructor parameter decorators
@inject(Token)           // explicit token for this parameter
@optional()              // mark as optional (undefined if unresolvable)
@optional(defaultValue)  // optional with explicit default

// Field decorators
@inject(Token)           // property injection

// Lifecycle hooks
@postConstruct()         // called after construction
@preDestroy()            // called on container.dispose()

// Circular dependency breaker
@lazy()                  // resolves on first access, not at construction
```

### 3.2 Modern Implementation — `Symbol.metadata`

TypeScript 5.2+ supports Stage 3 decorators with `Symbol.metadata`. This is our **only** decorator path.

```typescript
// ─── src/decorators/injectable.ts ───

const INJECTABLE_META = Symbol('tsneedle:injectable');

export interface InjectableMeta {
  lifecycle: Lifecycle;
  tags: string[];
}

export function injectable(options?: { lifecycle?: Lifecycle; tags?: string[] }) {
  return <T extends Constructor<any>>(
    target: T,
    context: ClassDecoratorContext<T>,
  ): T => {
    const meta: InjectableMeta = {
      lifecycle: options?.lifecycle ?? Lifecycle.Transient,
      tags: options?.tags ?? [],
    };

    // Store in the class's metadata object (ES2024)
    context.metadata!.set(INJECTABLE_META, meta);

    // Also store in our WeakMap registry for runtime lookup
    MetadataRegistry.set(target, meta);

    return target;
  };
}
```

```typescript
// ─── src/decorators/inject.ts ───

const INJECT_PARAMS_META = Symbol('tsneedle:inject:params');

export function inject<T>(token: Token<T>) {
  return (
    target: any,
    context: ClassMethodDecoratorContext | ClassFieldDecoratorContext,
  ) => {
    // Store parameter position → token mapping in metadata
    context.metadata!.set(INJECT_PARAMS_META, {
      ...(context.metadata!.get(INJECT_PARAMS_META) ?? {}),
      [context.name]: token,
    });
  };
}
```

```typescript
// ─── src/decorators/singleton.ts ───

export function singleton() {
  return injectable({ lifecycle: Lifecycle.Singleton });
}
```

### 3.3 `@injectable()` Is Required

Unlike tsyringe (which auto-registers all decorated classes into a global container), `tsneedle` **never uses globals**. You must explicitly register:

```typescript
@injectable()
class UserService {
  constructor(@inject(ILogger) private logger: ILogger) {}
}

const container = new Container();
container.registerClass(IUserService, UserService); // explicit registration required
```

**Why?** No hidden globals, no side-effect import ordering issues, testable and explicit.

### 3.4 The `@inject()` Discipline

Since we don't require `reflect-metadata`, every **interface** dependency must use `@inject(Token)`:

```typescript
@injectable()
class OrderService {
  constructor(
    @inject(ILogger) private logger: ILogger,              // interface → must use @inject
    @inject(IOrderRepo) private repo: IOrderRepo,          // interface → must use @inject
    private config: AppConfig,                              // concrete class → @inject optional
  ) {}
}
```

For **concrete class** parameters where the class itself is registered as a token, `@inject()` is optional (the container can infer the token from the class). This is the only inference we do, and it doesn't require `reflect-metadata`.

---

## 4. Metadata Registry (Internal)

No globals. No `reflect-metadata`. A `WeakMap`-based internal registry.

```typescript
// ─── src/metadata/metadata-registry.ts ───

const InjectableMeta = Symbol('tsneedle:injectable');
const ParamsMeta = Symbol('tsneedle:params');
const PropsMeta = Symbol('tsneedle:props');
const PostConstructMeta = Symbol('tsneedle:postConstruct');
const PreDestroyMeta = Symbol('tsneedle:preDestroy');

class MetadataRegistry {
  private static injectableData = new WeakMap<Constructor<any>, InjectableMeta>();
  private static paramTokens = new WeakMap<Constructor<any>, Map<number, Token<any>>>();
  private static optionalParams = new WeakMap<Constructor<any>, Set<number>>();
  private static propInjections = new WeakMap<Constructor<any>, Map<string | symbol, Token<any>>>();
  private static postConstructMethods = new WeakMap<Constructor<any>, string | symbol>();
  private static preDestroyMethods = new WeakMap<Constructor<any>, string | symbol>>();

  static registerInjectable(cls: Constructor<any>, meta: InjectableMeta): void;
  static registerParamToken(cls: Constructor<any>, index: number, token: Token<any>): void;
  static registerOptional(cls: Constructor<any>, index: number): void;
  static registerPropertyInjection(cls: Constructor<any>, prop: string | symbol, token: Token<any>): void;
  static registerPostConstruct(cls: Constructor<any>, method: string | symbol): void;
  static registerPreDestroy(cls: Constructor<any>, method: string | symbol): void;

  static getInjectable(cls: Constructor<any>): InjectableMeta | undefined;
  static getParamTokens(cls: Constructor<any>): Map<number, Token<any>>;
  static getOptionalParams(cls: Constructor<any>): Set<number>;
  static getPropertyInjections(cls: Constructor<any>): Map<string | symbol, Token<any>>;
  static getPostConstruct(cls: Constructor<any>): string | symbol | undefined;
  static getPreDestroy(cls: Constructor<any>): string | symbol | undefined;
}
```

**Why WeakMap over `Symbol.metadata`?**
- `context.metadata` in Stage 3 decorators is **shared across all decorators on the same class**, which means key collisions between libraries are possible.
- WeakMap is **truly private** — no external code can read or mutate our metadata.
- WeakMap is **runtime-agnostic** — works identically in every JS runtime.
- We still use `context.metadata` as a secondary storage for decorator-to-decorator communication within the same class, but the **source of truth** for resolution is the WeakMap.

---

## 5. Container Architecture

### 5.1 Core Class

```typescript
// ─── src/container/container.ts ───

class Container {
  private readonly registry: Map<symbol | string, Binding<any>>;
  private readonly cache: Map<symbol | string, any>;
  private readonly disposables: Array<{ token: Token<any>; dispose: (instance: any) => Promise<void> | void }>;
  private readonly parent: Container | null;
  private readonly scopeName: string | null;
  private _disposed: boolean;

  constructor(parent?: Container, scopeName?: string);

  // ─── Registration ───

  register<T>(token: Token<T>, provider: Provider<T>, options?: RegisterOptions): void;
  registerClass<T>(token: Token<T>, cls: Constructor<T>, options?: RegisterOptions): void;
  registerFactory<T>(token: Token<T>, factory: FactoryFunction<T>, options?: RegisterOptions): void;
  registerSingleton<T>(token: Token<T>, cls: Constructor<T>): void;
  registerValue<T>(token: Token<T>, value: T): void;

  // ─── Resolution ───

  resolve<T>(token: Token<T>): T;
  resolveAsync<T>(token: Token<T>): Promise<T>;
  tryResolve<T>(token: Token<T>): T | undefined;
  tryResolveAsync<T>(token: Token<T>): Promise<T | undefined>;

  // ─── Scoping ───

  createScope(name: string): Container;

  // ─── Lifecycle ───

  dispose(): Promise<void>;

  // ─── Introspection ───

  has(token: Token<any>): boolean;
  getBindings(): ReadonlyMap<symbol | string, Binding<any>>;
  get parent(): Container | null;
  get isDisposed(): boolean;
}
```

### 5.2 Resolution Engine

```
resolve<T>(token)
│
├─ 1. GUARD: Is container disposed? → throw
│
├─ 2. CHECK CACHE (Singletons/Scoped)
│   ├─ Check this container's cache
│   ├─ If singleton → check root container's cache
│   └─ If found → return cached instance ✅
│
├─ 3. LOOKUP BINDING
│   ├─ Check this container's registry
│   ├─ If not found → check parent container (recursively)
│   └─ If not found anywhere → throw ResolutionError
│
├─ 4. CIRCULAR DEPENDENCY CHECK
│   └─ Push token onto resolution stack
│       └─ If already in stack → throw CircularDependencyError
│
├─ 5. DISPATCH ON PROVIDER TYPE
│   ├─ ValueProvider → return value (no caching)
│   ├─ AliasProvider → resolve(target token) (recursion)
│   ├─ ClassProvider → resolveClass(class)
│   └─ FactoryProvider → resolveFactory(factory)
│
├─ 6. resolveClass<T>(cls: Constructor<T>)
│   ├─ Get parameter tokens from MetadataRegistry
│   ├─ For each parameter:
│   │   ├─ Has @inject(Token)? → resolve(Token)
│   │   ├─ Is concrete class in registry? → resolve(classToken)
│   │   ├─ Has @optional()? → tryResolve() or default
│   │   └─ Otherwise → throw ResolutionError with helpful message
│   ├─ new cls(...resolvedParams)
│   ├─ Resolve property injections
│   └─ Call @postConstruct() if present
│
├─ 7. resolveFactory<T>(factory)
│   ├─ Resolve factory's declared inject tokens (if any)
│   ├─ Call factory(resolutionContext, ...resolvedDeps)
│   └─ Return result
│
├─ 8. CACHE INSTANCE
│   ├─ Singleton → cache in root container
│   ├─ Scoped → cache in scope container
│   └─ Transient → no cache
│
├─ 9. REGISTER DISPOSAL
│   └─ If @preDestroy or options.dispose → add to disposables list
│
└─ 10. POP RESOLUTION STACK & RETURN

resolveAsync<T>(token)
  └─ Same algorithm, but:
     - FactoryProvider can return Promise<T>
     - @postConstruct can be async
     - All recursive calls use resolveAsync
     - Mixed: if sync path attempted on async factory → throw AsyncFactoryError
```

### 5.3 Hierarchical Scoping

```
┌─────────────── Root Container ───────────────┐
│  [Singleton Cache]                             │
│  ILogger ──► ConsoleLogger instance           │
│  IConfig ──► Config instance                   │
│                                                │
│  ┌──────── Request Scope "req-1" ──────────┐  │
│  │  [Scoped Cache]                           │  │
│  │  IRequestContext ──► RequestContext #1    │  │
│  │  IAuthService ──► AuthService #1          │  │
│  │                                           │  │
│  │  ┌───── Child Scope ───────────────┐     │  │
│  │  │  (e.g., per-subrequest)          │     │  │
│  │  └──────────────────────────────────┘     │  │
│  └───────────────────────────────────────────┘  │
│                                                │
│  ┌──────── Request Scope "req-2" ──────────┐  │
│  │  IRequestContext ──► RequestContext #2    │  │
│  └───────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

**Rules:**
- **Singletons** are always cached in the **root** container, regardless of which scope resolves them.
- **Scoped** instances are cached in the **scope** where they're first resolved.
- **Transient** instances are **never cached** — new instance every time.
- Child scopes **inherit** all bindings from parent.
- Child scopes can **override** parent bindings.

```typescript
const root = new Container();
root.registerSingleton(ILogger, ConsoleLogger);
root.registerScoped(IRequestContext, RequestContext);

const scope1 = root.createScope('request-1');
const scope2 = root.createScope('request-2');

// Singletons: same instance everywhere
root.resolve(ILogger) === scope1.resolve(ILogger); // true

// Scoped: same instance within scope, different across scopes
scope1.resolve(IRequestContext) !== scope2.resolve(IRequestContext); // true
scope1.resolve(IRequestContext) === scope1.resolve(IRequestContext); // true
```

---

## 6. Module System

```typescript
// ─── src/modules/module.ts ───

interface ModuleDefinition {
  readonly providers: readonly ProviderRegistration[];
  readonly exports?: readonly Token<any>[];
  readonly imports?: readonly ModuleDefinition[];
}

interface ProviderRegistration {
  readonly token: Token<any>;
  readonly provider: Provider<any>;
  readonly lifecycle?: Lifecycle;
  readonly tags?: readonly string[];
  readonly dispose?: (instance: any) => Promise<void> | void;
}

function defineModule(def: ModuleDefinition): ModuleDefinition {
  return def;  // identity — just a typed object, no magic
}

// Container gains a load method
class Container {
  load(module: ModuleDefinition): void {
    for (const imp of module.imports ?? []) {
      this.load(imp);
    }
    for (const reg of module.providers) {
      this.register(reg.token, reg.provider, {
        lifecycle: reg.lifecycle,
        tags: reg.tags,
        dispose: reg.dispose,
      });
    }
  }
}
```

> **Design note:** Modules are **pure data** — no decorators, no classes, just typed objects. This makes them easy to compose, test, and tree-shake. `exports` is informational for future framework integration (the container doesn't enforce visibility within itself; it's a flat registry).

```typescript
// Usage
const DatabaseModule = defineModule({
  providers: [
    { token: ILogger, provider: { type: 'class', useClass: ConsoleLogger }, lifecycle: Lifecycle.Singleton },
    { token: IDatabase, provider: { type: 'class', useClass: PostgresDB }, lifecycle: Lifecycle.Singleton },
  ],
  exports: [ILogger, IDatabase],
});

const AppModule = defineModule({
  imports: [DatabaseModule],
  providers: [
    { token: IUserService, provider: { type: 'class', useClass: UserService } },
  ],
});

const container = new Container();
container.load(AppModule);
```

---

## 7. Error Design

Errors are **first-class** in `tsneedle`. Every error carries full diagnostic context.

### 7.1 Error Classes

```typescript
// ─── src/errors/circular-dependency-error.ts ───

class CircularDependencyError extends Error {
  readonly name = 'CircularDependencyError';
  readonly chain: readonly Token<any>[];
  readonly culprit: Token<any>;

  constructor(chain: Token<any>[], culprit: Token<any>) {
    const formatted = chain.map(t => t.name).join(' → ');
    super(
      `Circular dependency detected:\n\n` +
      `  ${formatted} → ${culprit.name}\n` +
      `  ${' '.repeat(formatted.length)}${'^'.repeat(culprit.name.length)}\n\n` +
      `Hint: Use @lazy() or @inject(Token) @optional() to break the cycle.`
    );
    this.chain = chain;
    this.culprit = culprit;
  }
}
```

```typescript
// ─── src/errors/resolution-error.ts ───

class ResolutionError extends Error {
  readonly name = 'ResolutionError';
  readonly token: Token<any>;
  readonly containerPath: readonly string[];

  constructor(token: Token<any>, containerPath: string[], registered?: string[]) {
    const scope = containerPath.length > 0 ? ` (scope: ${containerPath.join(' → ')})` : '';
    super(
      `No binding found for token "${token.name}"${scope}\n\n` +
      (registered?.length
        ? `Registered tokens:\n  ${registered.map(t => `• ${t}`).join('\n  ')}\n\n`
        : '') +
      `Hint: Did you forget to register "${token.name}" in this container?`
    );
    this.token = token;
    this.containerPath = containerPath;
  }
}
```

```typescript
// ─── src/errors/async-factory-error.ts ───

class AsyncFactoryError extends Error {
  readonly name = 'AsyncFactoryError';
  readonly token: Token<any>;

  constructor(token: Token<any>) {
    super(
      `Attempted synchronous resolution of "${token.name}" which has an async factory.\n\n` +
      `Hint: Use container.resolveAsync("${token.name}") instead of container.resolve().`
    );
    this.token = token;
  }
}
```

---

## 8. Disposal Architecture

```typescript
// ─── src/container/disposal.ts ───

class Container {
  private disposalStack: Array<{
    token: Token<any>;
    instance: any;
    dispose?: (instance: any) => Promise<void> | void;
    preDestroy?: string | symbol;
  }> = [];

  async dispose(): Promise<void> {
    if (this._disposed) return;
    this._disposed = true;

    // Dispose in REVERSE registration order (like stack unwinding)
    for (const entry of [...this.disposalStack].reverse()) {
      try {
        if (entry.dispose) {
          await entry.dispose(entry.instance);
        } else if (entry.preDestroy) {
          await entry.instance[entry.preDestroy]();
        }
      } catch (err) {
        // Don't let one disposal failure stop others
        // Log but continue
        console.error(
          `tsneedle: Error disposing "${entry.token.name}": ${err}`
        );
      }
    }

    // Clear all state
    this.registry.clear();
    this.cache.clear();
    this.disposalStack.length = 0;

    // Dispose child scopes
    for (const child of this.scopes.values()) {
      await child.dispose();
    }
  }
}
```

---

## 9. Project Structure

```
tsneedle/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── pnpm-lock.yaml
├── vitest.config.ts
├── .github/
│   └── workflows/
│       └── ci.yml
├── src/
│   ├── index.ts                        # Public barrel export
│   │
│   ├── token/
│   │   ├── token.ts                    # Token<T>, createToken<T>
│   │   └── type-safety.ts              # Branded types, phantom types
│   │
│   ├── container/
│   │   ├── container.ts                # Container class
│   │   ├── resolution.ts               # Sync resolution engine
│   │   ├── resolution-async.ts          # Async resolution engine
│   │   ├── resolution-stack.ts          # Circular dependency detection
│   │   └── scope.ts                    # Scope management
│   │
│   ├── registry/
│   │   └── registry.ts                 # Binding registry
│   │
│   ├── binding/
│   │   ├── binding.ts                  # Binding<T> type
│   │   ├── provider.ts                  # Provider discriminated union
│   │   ├── lifecycle.ts                 # Lifecycle enum
│   │   └── register-options.ts         # RegisterOptions
│   │
│   ├── metadata/
│   │   ├── metadata-registry.ts         # WeakMap-based internal store
│   │   └── metadata-symbols.ts          # Internal Symbol keys
│   │
│   ├── decorators/
│   │   ├── injectable.ts                # @injectable
│   │   ├── inject.ts                    # @inject
│   │   ├── singleton.ts                 # @singleton
│   │   ├── scoped.ts                    # @scoped
│   │   ├── optional.ts                  # @optional
│   │   ├── lazy.ts                      # @lazy
│   │   ├── post-construct.ts            # @postConstruct
│   │   ├── pre-destroy.ts               # @preDestroy
│   │   └── index.ts                     # Re-exports
│   │
│   ├── modules/
│   │   └── module.ts                    # defineModule, ModuleDefinition
│   │
│   ├── context/
│   │   └── resolution-context.ts        # ResolutionContext interface
│   │
│   └── errors/
│       ├── circular-dependency-error.ts
│       ├── resolution-error.ts
│       ├── async-factory-error.ts
│       ├── disposed-container-error.ts
│       └── index.ts
│
├── tests/
│   ├── unit/
│   │   ├── token.test.ts
│   │   ├── container.test.ts
│   │   ├── resolution.test.ts
│   │   ├── decorators.test.ts
│   │   ├── registry.test.ts
│   │   ├── metadata-registry.test.ts
│   │   ├── module.test.ts
│   │   └── errors.test.ts
│   │
│   ├── integration/
│   │   ├── lifecycle-singleton.test.ts
│   │   ├── lifecycle-transient.test.ts
│   │   ├── lifecycle-scoped.test.ts
│   │   ├── hierarchical-scopes.test.ts
│   │   ├── circular-dependencies.test.ts
│   │   ├── async-resolution.test.ts
│   │   ├── disposal.test.ts
│   │   ├── multi-provider.test.ts
│   │   └── property-injection.test.ts
│   │
│   ├── types/
│   │   ├── token-types.ts              # Compile-time type tests
│   │   ├── provider-types.ts            # Compile-time type tests
│   │   └── container-types.ts           # Compile-time type tests
│   │
│   └── compatibility/
│       └── reflect-metadata/            # @tsneedle/reflect-bridge tests
│           └── auto-param-inference.test.ts
│
├── examples/
│   ├── 01-basic-usage.ts
│   ├── 02-singleton-transient-scoped.ts
│   ├── 03-async-factories.ts
│   ├── 04-modules.ts
│   ├── 05-testing-with-mocks.ts
│   └── 06-circular-dependencies.ts
│
└── docs/
    ├── getting-started.md
    ├── api-reference.md
    ├── decorators.md
    ├── modules.md
    ├── scoping.md
    ├── async.md
    ├── testing.md
    ├── migrating-from-tsyringe.md
    └── migrating-from-inversify.md
```

---

## 10. Package Configuration

### `package.json`

```json
{
  "name": "tsneedle",
  "version": "0.1.0",
  "description": "A sharp, modern, lightweight dependency injection container for TypeScript — ESM + CJS, zero dependencies, runtime-agnostic",
  "type": "module",
  "main": "./dist/index.cjs",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./reflect": {
      "import": "./dist/reflect.js",
      "require": "./dist/reflect.cjs",
      "types": "./dist/reflect.d.ts"
    }
  },
  "files": ["dist", "!dist/**/*.test.*"],
  "sideEffects": false,
  "engines": {
    "node": ">=18.0.0"
  },
  "peerDependencies": {
    "typescript": ">=5.2.0",
    "reflect-metadata": ">=0.2.0"
  },
  "peerDependenciesMeta": {
    "reflect-metadata": {
      "optional": true
    }
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.1.0",
    "@vitest/coverage-v8": "^2.1.0",
    "tsup": "^8.3.0",
    "reflect-metadata": "^0.2.2",
    "publint": "^0.2.0",
    "are-the-type-writes-correct": "^2.0.0",
    "@biomejs/biome": "^1.9.0"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:types": "tsc --project tests/types/tsconfig.json",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "check:exports": "publint",
    "check:types-write": "attw --pack",
    "prepublishOnly": "pnpm build && pnpm test"
  },
  "keywords": [
    "di",
    "dependency injection",
    "ioc",
    "inversion of control",
    "typescript",
    "esm",
    "container",
    "injectable",
    "decorator",
    "lightweight"
  ],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourorg/tsneedle"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "ESNext.Decorators", "Decorators"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    "useUnknownInCatchVariables": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "stripInternal": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

> Key flags: `verbatimModuleSyntax` (ESM enforcement), `exactOptionalPropertyTypes` (strict optionals), `noUncheckedIndexedAccess`, `isolatedModules`. Maximum strictness.

### `tsup.config.ts`

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/reflect.ts'],
  format: ['esm', 'cjs'],            // ESM primary, CJS for legacy consumers
  dts: true,                        // emit .d.ts
  splitting: true,
  treeshake: true,
  clean: true,
  target: 'node18',
  platform: 'neutral',              // runtime-agnostic
  minify: false,                    // DX over size for DI container
  sourcemap: true,
});
```

### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    typecheck: {
      include: ['tests/types/**/*.ts'],
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
});
```

---

## 11. The `reflect` Sub-Export

This is the **opt-in bridge** for users who want automatic parameter type inference. It's never imported by the core path.

```typescript
// ─── src/reflect.ts (separate sub-export) ───

/**
 * tsneedle/reflect — Opt-in reflect-metadata integration
 *
 * Importing this module enables automatic constructor parameter type inference
 * using TypeScript's emitDecoratorMetadata. This requires:
 *   1. "reflect-metadata" installed as a peer dependency
 *   2. "emitDecoratorMetadata": true in tsconfig.json
 *   3. "experimentalDecorators": true in tsconfig.json (for param metadata)
 *
 * WITHOUT this import, @inject(Token) is required on every constructor parameter.
 * WITH this import, TypeScript-emitted type metadata is used as fallback.
 */

import 'reflect-metadata';
import { MetadataRegistry } from './metadata/metadata-registry.js';

// Patch the resolution engine to check reflect-metadata as fallback
export function enableReflectMetadata(): void {
  MetadataRegistry.setReflectMode(true);
}

// Auto-enable on import
enableReflectMetadata();
```

```typescript
// User code:
import 'tsneedle/reflect'; // one import, activates the bridge

@injectable()
class UserService {
  // Now constructor parameter types are inferred automatically
  // (for concrete classes, not interfaces)
  constructor(private logger: ConsoleLogger) {}  // no @inject needed for concrete types
  
  // Interfaces still need @inject
  constructor(@inject(ILogger) private logger: ILogger) {}
}
```

The core resolution engine checks `MetadataRegistry.isReflectMode()` and, if true, falls back to `reflect-metadata`'s `design:paramtypes` when no explicit `@inject()` is found.

---

## 12. Full Public API Surface

```typescript
// ─── src/index.ts ───

// Token
export { createToken } from './token/token.js';
export type { Token } from './token/token.js';

// Container
export { Container } from './container/container.js';

// Lifecycle
export { Lifecycle } from './binding/lifecycle.js';

// Provider types
export type {
  Provider,
  ClassProvider,
  FactoryProvider,
  ValueProvider,
  AliasProvider,
} from './binding/provider.js';

// Binding types
export type { Binding, BindingOptions } from './binding/binding.js';
export type { RegisterOptions } from './binding/register-options.js';

// Decorators
export { injectable } from './decorators/injectable.js';
export { inject } from './decorators/inject.js';
export { singleton } from './decorators/singleton.js';
export { scoped } from './decorators/scoped.js';
export { optional } from './decorators/optional.js';
export { lazy } from './decorators/lazy.js';
export { postConstruct } from './decorators/post-construct.js';
export { preDestroy } from './decorators/pre-destroy.js';

// Module
export { defineModule } from './modules/module.js';
export type { ModuleDefinition, ProviderRegistration } from './modules/module.js';

// Resolution context
export type { ResolutionContext } from './context/resolution-context.js';

// Errors
export { CircularDependencyError } from './errors/circular-dependency-error.js';
export { ResolutionError } from './errors/resolution-error.js';
export { AsyncFactoryError } from './errors/async-factory-error.js';
export { DisposedContainerError } from './errors/disposed-container-error.js';

// Utility types
export type { Constructor, InstanceOf } from './utils/constructor.js';
```

---

## 13. Type Safety Verification

### 13.1 Compile-Time Type Tests

These are `.ts` files that **must compile without errors** — if they fail, the API types are wrong.

```typescript
// ─── tests/types/token-types.ts ───

import { createToken, Container, Lifecycle } from 'tsneedle';
import type { Token } from 'tsneedle';

// ✅ createToken preserves interface type
const IRepo = createToken<IRepo>('IRepo');
type Result = typeof IRepo extends Token<IRepo> ? true : false;
const _check1: Result = true;

// ✅ resolve returns the token's type
const container = new Container();
const repo = container.resolve(IRepo);
const _check2: IRepo = repo; // must compile

// ❌ resolve does NOT return wrong type
// const _bad: string = container.resolve(IRepo); // Type error!

// ❌ Tokens are not interchangeable
const ICache = createToken<ICache>('IRepo'); // same string, different type
// container.register(ICache, { type: 'class', useClass: SomeRepo }); // Type error if SomeRepo !: ICache
```

```typescript
// ─── tests/types/provider-types.ts ───

import { createToken, Container } from 'tsneedle';

interface IRepo { find(): string; }
class PostgresRepo implements IRepo { find() { return 'pg'; } }
class MongoRepo implements IRepo { find() { return 'mongo'; } }

const IRepo = createToken<IRepo>('IRepo');
const container = new Container();

// ✅ Correct type implements interface
container.register(IRepo, { type: 'class', useClass: PostgresRepo });

// ✅ Factory provider return type matches
container.register(IRepo, {
  type: 'factory',
  useFactory: () => new PostgresRepo(),
});

// ❌ Wrong type
// container.register(IRepo, { type: 'class', useClass: WrongClass }); // Type error!
```

We'll use `are-the-type-writes-correct` (attw) + a dedicated `tsconfig.types.json` for these compile-time checks, integrated into CI.

---

## 14. CI Pipeline

```yaml
# ─── .github/workflows/ci.yml ───

name: CI
on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action/setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test:coverage
      - run: pnpm test:types
      - run: pnpm build
      - run: pnpm check:exports

  runtime-compat:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action/setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      # Test on Node
      - run: node --test tests/compat/node.mjs
      # Test on Bun (install bun, run tests)
      - uses: oven-sh/setup-bun@v2
      - run: bun test tests/compat/bun.test.ts
```

---

## 15. Quick-Start (What the README Will Show)

```typescript
import {
  Container,
  createToken,
  injectable,
  inject,
  singleton,
  Lifecycle,
  defineModule,
  postConstruct,
  preDestroy,
} from 'tsneedle';

// ────────────────────────────────────────────────
// 1. Define your interfaces & tokens
// ────────────────────────────────────────────────

interface ILogger {
  log(msg: string): void;
}

interface IUserRepository {
  findById(id: string): Promise<User | null>;
}

interface IUserService {
  getUser(id: string): Promise<User | null>;
}

const ILogger = createToken<ILogger>('ILogger');
const IUserRepository = createToken<IUserRepository>('IUserRepository');
const IUserService = createToken<IUserService>('IUserService');

// ────────────────────────────────────────────────
// 2. Implement & decorate your classes
// ─────────────────────────


