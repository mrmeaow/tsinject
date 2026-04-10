# Migrating from **InversifyJS** to **tsinject**

Inversify uses a powerful IoC container with class‑based identifiers, optional reflection, and a rich binding API. **tsinject** takes a slimmer, type‑first approach: tokens replace class identifiers for interfaces, the core never depends on `reflect-metadata`, and the container is deliberately minimal.

---

## Major differences

| Aspect | Inversify | tsinject |
|--------|-----------|----------|
| **Identifier** | Class constructor or Symbol (often `Symbol.for('ILogger')`). | Branded `Token<T>` created via `createToken<T>(name)`. |
| **Global container** | Usually a single `container` imported throughout the app. | No global container – you instantiate `new Container()` (or child scopes) explicitly. |
| **Metadata** | Requires `reflect-metadata` and `emitDecoratorMetadata` for automatic constructor injection. | Core does **not** require `reflect-metadata`; you must explicitly annotate interface parameters with `@inject(Token)`. An optional `tsinject/reflect` bridge can be imported to regain automatic inference. |
| **Bindings** | Fluent API (`bind<ILogger>(TYPES.ILogger).to(ConsoleLogger).inSingletonScope()`). | Simple registration methods (`registerClass`, `registerFactory`, `registerValue`) with a clear `Provider` discriminated union. |
| **Modules** | `container.load(myModule)` where a module is a class that configures bindings. | Pure‑data `defineModule({ providers, imports, exports })` objects – no side‑effects, easier to test and tree‑shake. |
| **Error handling** | Generic errors; stack traces may be opaque. | Typed error classes (`ResolutionError`, `CircularDependencyError`, `AsyncFactoryError`) with token names and helpful hints. |
| **Lifecycle** | `@singleton()`, `@transient()`, `@requestScope()`. | `@injectable({ lifecycle })` or shorthands `@singleton()`, `@scoped()`. |

---

## Migration steps

1. **Create tokens for every interface**
   ```ts
   // Inversify (symbol identifier)
   const TYPES = { ILogger: Symbol.for('ILogger') };
   // tsinject
   export const ILogger = createToken<ILogger>('ILogger');
   ```
2. **Replace `@inject` usage**
   ```ts
   // Inversify
   @injectable()
   class Service { constructor(@inject(TYPES.ILogger) private logger: ILogger) {} }
   // tsinject
   @injectable()
   class Service { constructor(@inject(ILogger) private logger: ILogger) {} }
   ```
3. **Instantiate a container instead of using the global one**
   ```ts
   // Inversify
   import { container } from './inversify.config';
   const svc = container.get(Service);
   // tsinject
   const container = new Container();
   container.registerClass(ILogger, ConsoleLogger);
   container.registerClass(Service, Service);
   const svc = container.resolve(Service);
   ```
4. **Translate binding configurations**
   ```ts
   // Inversify module
   const myModule = new ContainerModule(bind => {
     bind<ILogger>(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
   });
   container.load(myModule);
   // tsinject module
   export const MyModule = defineModule({
     providers: [
       { token: ILogger, provider: { type: 'class', useClass: ConsoleLogger }, lifecycle: Lifecycle.Singleton },
     ],
   });
   container.load(MyModule);
   ```
5. **Adjust lifecycles**
   Use `Lifecycle.Singleton`, `Lifecycle.Transient`, or `Lifecycle.Scoped` in `RegisterOptions` or via the decorator shorthand.
6. **Remove reliance on `reflect-metadata`**
   If you want to keep automatic constructor injection for concrete classes, add a single `import 'tsinject/reflect';` at the entry point. Otherwise, add explicit `@inject` for all interface parameters.
7. **Update tests**
   Replace `container.get<T>()` with `container.resolve<T>(Token)` or `container.resolve<T>(MyClass)` as appropriate. Ensure each test creates its own `Container` instance for isolation.

---

## Example conversion

### Inversify setup
```ts
import 'reflect-metadata';
import { Container, injectable, inject } from 'inversify';

const TYPES = { Logger: Symbol.for('Logger') };

interface ILogger { log(msg: string): void; }

@injectable()
class ConsoleLogger implements ILogger { log(msg: string) { console.log(msg); } }

@injectable()
class Service {
  constructor(@inject(TYPES.Logger) private logger: ILogger) {}
  run() { this.logger.log('run'); }
}

const container = new Container();
container.bind<ILogger>(TYPES.Logger).to(ConsoleLogger).inSingletonScope();
container.bind<Service>(Service).toSelf();
export default container;
```

### tsinject equivalent
```ts
import { Container, createToken, injectable, inject, singleton } from 'tsinject';

export const ILogger = createToken<ILogger>('ILogger');

interface ILogger { log(msg: string): void; }

@singleton()
class ConsoleLogger implements ILogger { log(msg: string) { console.log(msg); } }

@injectable()
class Service {
  constructor(@inject(ILogger) private logger: ILogger) {}
  run() { this.logger.log('run'); }
}

const container = new Container();
container.registerClass(ILogger, ConsoleLogger);
container.registerClass(Service, Service);
export default container;
```

The tsinject version eliminates the need for `reflect-metadata` imports and provides compile‑time safety via the branded token system.
