# API Reference

The public surface of **tsneedle** is deliberately small and type‑safe. All symbols below are re‑exported from `src/index.ts`.

---

## Tokens

```typescript
export { createToken } from './token/token.js';
export type { Token } from './token/token.js';
```

### `createToken<T>(name: string): Token<T>`
Creates a **branded token** that uniquely identifies a dependency at compile time and runtime. The token carries a phantom generic `T` that enforces type safety when registering or resolving.

---

## Container

```typescript
export { Container } from './container/container.js';
```

### `new Container(parent?: Container, scopeName?: string)`
Creates a DI container. Optionally takes a parent container to form a hierarchy and a `scopeName` for debugging.

#### Registration methods
- `register<T>(token: Token<T>, provider: Provider<T>, options?: RegisterOptions): void`
- `registerClass<T>(token: Token<T>, cls: Constructor<T>, options?: RegisterOptions): void`
- `registerFactory<T>(token: Token<T>, factory: (ctx: ResolutionContext) => T | Promise<T>, options?: RegisterOptions): void`
- `registerSingleton<T>(token: Token<T>, cls: Constructor<T>): void`
- `registerValue<T>(token: Token<T>, value: T): void`

#### Resolution methods
- `resolve<T>(token: Token<T>): T`
- `resolveAsync<T>(token: Token<T>): Promise<T>`
- `tryResolve<T>(token: Token<T>): T | undefined`
- `tryResolveAsync<T>(token: Token<T>): Promise<T | undefined>`

#### Introspection & utilities
- `has(token: Token<any>): boolean`
- `hasAsync(token: Token<any>): boolean`
- `createScope(name: string): Container`
- `dispose(): Promise<void>`
- `load(module: ModuleDefinition): void` (see Modules section)

---

## Lifecycle Enum

```typescript
export { Lifecycle } from './binding/lifecycle.js';
```

```typescript
enum Lifecycle {
  Singleton = 'singleton',
  Transient = 'transient',
  Scoped = 'scoped',
}
```

---

## Provider Types

```typescript
export type {
  Provider,
  ClassProvider,
  FactoryProvider,
  ValueProvider,
  AliasProvider,
} from './binding/provider.js';
```

- `ClassProvider<T>` – `{ type: 'class', useClass: Constructor<T> }`
- `FactoryProvider<T>` – `{ type: 'factory', useFactory: (ctx: ResolutionContext) => T | Promise<T>, inject?: readonly Token<any>[] }`
- `ValueProvider<T>` – `{ type: 'value', useValue: T }`
- `AliasProvider<T>` – `{ type: 'alias', useToken: Token<T> }`

---

## Binding Types

```typescript
export type { Binding, BindingOptions } from './binding/binding.js';
export type { RegisterOptions } from './binding/register-options.js';
```

---

## Decorators

```typescript
export { injectable } from './decorators/injectable.js';
export { inject } from './decorators/inject.js';
export { singleton } from './decorators/singleton.js';
export { scoped } from './decorators/scoped.js';
export { optional } from './decorators/optional.js';
export { lazy } from './decorators/lazy.js';
export { postConstruct } from './decorators/post-construct.js';
export { preDestroy } from './decorators/pre-destroy.js';
```

See the **Decorators** guide for usage details.

---

## Modules

```typescript
export { defineModule } from './modules/module.js';
export type { ModuleDefinition, ProviderRegistration } from './modules/module.js';
```

---

## Resolution Context

```typescript
export type { ResolutionContext } from './context/resolution-context.js';
```

---

## Errors

```typescript
export { CircularDependencyError } from './errors/circular-dependency-error.js';
export { ResolutionError } from './errors/resolution-error.js';
export { AsyncFactoryError } from './errors/async-factory-error.js';
export { DisposedContainerError } from './errors/disposed-container-error.js';
```

---

## Utility Types

```typescript
export type { Constructor, InstanceOf } from './utils/constructor.js';
```

---

All symbols are exported for both **ESM** and **CommonJS**. The `package.json` defines both an `exports` map (`"./"` → `"./dist/index.js"` for ESM and `"./cjs"` → `"./dist/index.cjs"` for CJS) to support legacy environments while keeping tree‑shaking benefits for modern bundlers.
