# Decorator API

tsinject’s decorators rely on **Stage 3** TypeScript decorators and `Symbol.metadata`. They require **TypeScript ≥ 5.2**.

---

## Class decorators

### `@injectable([options])`
Marks a class as injectable. By default the lifecycle is **Transient**.

```typescript
@injectable()
class Service {}
```

**Options** (all optional):
- `lifecycle?: Lifecycle` – choose `Singleton`, `Transient`, or `Scoped`.
- `tags?: string[]` – arbitrary tags for later introspection.

### `@singleton()`
Shorthand for `@injectable({ lifecycle: Lifecycle.Singleton })`.

```typescript
@singleton()
class GlobalCache {}
```

### `@scoped()`
Shorthand for `@injectable({ lifecycle: Lifecycle.Scoped })`.

```typescript
@scoped()
class RequestContext {}
```

---

## Parameter decorators (constructor)

### `@inject(Token)`
Explicitly specify which token should be injected into a constructor parameter. Required for interface‑typed parameters because tsinject never uses `reflect-metadata` by default.

```typescript
@injectable()
class Foo {
  constructor(@inject(ILogger) private logger: ILogger) {}
}
```

### `@optional([defaultValue])`
Marks a dependency as optional. If the token cannot be resolved, the parameter receives `undefined` or the provided `defaultValue`.

```typescript
@injectable()
class Bar {
  constructor(@optional() private maybeLogger?: ILogger) {}
}
```

---

## Property decorators (field injection)

### `@inject(Token)`
Inject directly into a class field. Useful for circular‑dependency scenarios where constructor injection isn’t possible.

```typescript
@injectable()
class Baz {
  @inject(IConfig) private config!: Config;
}
```

---

## Lifecycle hooks

### `@postConstruct()`
Method executed **after** the instance has been constructed and all dependencies resolved. Can be `async`.

```typescript
@injectable()
class InitService {
  @postConstruct()
  async init() {
    await this.db.connect();
  }
}
```

### `@preDestroy()`
Method executed when the container (or a scoped child) is disposed. Allows cleanup of resources.

```typescript
@injectable()
class TempFileHolder {
  private tempPath = '/tmp/xyz';

  @preDestroy()
  cleanup() {
    fs.rmSync(this.tempPath);
  }
}
```

---

## Circular‑dependency breaker

### `@lazy()`
Defers resolution of a dependency until the first property access, avoiding eager circular‑dependency errors.

```typescript
@injectable()
class A {
  @lazy() @inject(BToken) private b!: B;
}
```

---

## Internals

All decorators store metadata in two places:
1. **`context.metadata`** – the `Symbol.metadata` map shared across decorators on the same class, used for intra‑library communication.
2. **`MetadataRegistry`** – a *WeakMap*‑based private store that is the source of truth for runtime resolution. This guarantees no external code can read or tamper with our metadata.

Refer to the source files under `src/decorators/` for implementation details.
