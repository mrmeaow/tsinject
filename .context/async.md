# Async Resolution

tsneedle distinguishes **synchronous** and **asynchronous** resolution paths. The core algorithm is the same, but factories may return a `Promise<T>` and lifecycle hooks (`@postConstruct`, `@preDestroy`) can be `async`.

---

## Synchronous vs Asynchronous APIs

- `container.resolve<T>(token: Token<T>): T`
  - Throws if the provider is a factory that returns a promise or if any transitive dependency is async.
- `container.resolveAsync<T>(token: Token<T>): Promise<T>`
  - Always safe; will `await` any async factories or hooks.
- `container.tryResolve<T>(token: Token<T>): T | undefined`
- `container.tryResolveAsync<T>(token: Token<T>): Promise<T | undefined>`

---

## Resolution engine (high‑level)

```text
resolve<T>(token)
│
├─ 1. Guard: container disposed?
├─ 2. Cache lookup (singleton / scoped)
├─ 3. Binding lookup (walk parent chain)
├─ 4. Circular‑dependency detection
├─ 5. Dispatch on Provider.type
│   ├─ ValueProvider → return value (no caching)
│   ├─ AliasProvider → resolve(target token) (recursive)
│   ├─ ClassProvider → resolveClass(cls)
│   └─ FactoryProvider → resolveFactory(factory)
├─ 6. resolveClass – resolve constructor params, property injections, postConstruct
├─ 7. resolveFactory – resolve any declared inject tokens, then call factory
├─ 8. Cache instance according to lifecycle
├─ 9. Register disposal if needed
└─ 10. Return instance
```

The async variant follows the same flow, with every step returning a promise when necessary. If a sync resolution attempts to use an async factory, an `AsyncFactoryError` is thrown.

---

## `AsyncFactoryError`

```typescript
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

This error surfaces when you call `container.resolve()` on a token whose provider (or any transitive dependency) returns a promise. The error message includes a helpful hint.

---

## When to use which API?

- **Purely sync code** – use `resolve` for simplicity and performance.
- **Any async factory** – always use `resolveAsync` (or `tryResolveAsync`).
- **Optional async access** – `tryResolveAsync` returns `undefined` if the token is not bound, without throwing.

Keep in mind that `@postConstruct` may be async; if you need the side‑effects to finish before using the instance, use the async resolution path.
