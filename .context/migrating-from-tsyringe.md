# Migrating from **tsyringe** to **tsinject**

Both libraries provide decorator‑based dependency injection for TypeScript, but **tsinject** makes stricter type guarantees and removes the implicit global container.

---

## Core differences

| Feature | tsyringe | tsinject |
|---------|----------|----------|
| **Container** | Global singleton (`container`) or explicit `container` import. | No globals – you always create a `new Container()` (or a scoped child). |
| **Token vs Class** | Usually inject concrete classes directly; interfaces require `injectable()` + `inject()` with a string token. | **Tokens** (`createToken<T>`) are mandatory for any non‑concrete type. Tokens are *branded* so `Token<A>` is not assignable to `Token<B>` even if they share a name. |
| **Reflect‑metadata** | Required (`emitDecoratorMetadata` + `reflect-metadata` import) for automatic parameter type inference. | Never required in the core path – `tsinject` works without any runtime metadata. An optional `tsinject/reflect` sub‑export can be imported to enable the same behaviour if you want a drop‑in migration path. |
| **Lifecycle** | `@singleton()`, `@scoped()`, `@transient()` decorators. | `@injectable({ lifecycle })` or shorthand decorators `@singleton()`, `@scoped()`. Options are type‑checked via the `Lifecycle` enum. |
| **Module system** | No built‑in concept – users manually register providers. | First‑class declarative modules via `defineModule({ providers, imports, exports })`. |
| **Error messages** | Generic `Error` with optional stack trace. | Rich, typed error classes (`CircularDependencyError`, `ResolutionError`, `AsyncFactoryError`) that include token names, dependency chains, and actionable hints. |

---

## Migration checklist

1. **Create tokens for interfaces**
   ```ts
   // tsyringe (string token)
   container.register('ILogger', { useClass: ConsoleLogger });
   // tsinject (branded token)
   export const ILogger = createToken<ILogger>('ILogger');
   container.registerClass(ILogger, ConsoleLogger);
   ```
2. **Remove global container usage**
   Replace any `import { container } from 'tsyringe'` with explicit `new Container()` instances. Pass the container where needed (e.g., test setup, server bootstrap).
3. **Update decorators**
   - `@injectable()` works the same, but you must supply a token for interface parameters via `@inject(Token)`. 
   - If you previously relied on `reflect-metadata` for automatic injection, either import `tsinject/reflect` (opt‑in bridge) **or** add explicit `@inject` annotations.
4. **Adjust lifecycles**
   ```ts
   // tsyringe singleton
   container.registerSingleton(ILogger, ConsoleLogger);
   // tsinject singleton via decorator or option
   @singleton()
   class ConsoleLogger implements ILogger {}
   // or
   container.registerClass(ILogger, ConsoleLogger, { lifecycle: Lifecycle.Singleton });
   ```
5. **Replace module loading (if any)**
   If you built manual registration groups, consider converting them to `defineModule` objects for clearer composition.
6. **Update tests**
   Ensure tests instantiate a fresh `Container` instead of using the global one. This improves isolation and mirrors tsinject’s design.
7. **Optional: enable reflect bridge**
   For a quick win, add `import 'tsinject/reflect';` at the entry point. This will make `@inject` optional for concrete classes, mimicking tsyringe’s behaviour while still keeping the core metadata‑free.

---

## Example conversion

### Before (tsyringe)
```ts
import { injectable, inject, container } from 'tsyringe';

interface ILogger { log(msg: string): void; }

@injectable()
class Service {
  constructor(@inject('ILogger') private logger: ILogger) {}
}

container.register('ILogger', { useClass: ConsoleLogger });
container.resolve(Service);
```

### After (tsinject)
```ts
import { Container, createToken, injectable, inject, singleton } from 'tsinject';

export interface ILogger { log(msg: string): void; }
export const ILogger = createToken<ILogger>('ILogger');

@injectable()
class Service {
  constructor(@inject(ILogger) private logger: ILogger) {}
}

const container = new Container();
container.registerClass(ILogger, ConsoleLogger);
container.resolve(Service);
```

The resulting code is fully type‑safe: the compiler will reject mismatched token types, and runtime errors provide clear diagnostic messages.
