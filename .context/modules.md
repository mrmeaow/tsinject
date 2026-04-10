# Modules

Modules let you **declare** a set of providers (and optionally imports/exports) as plain data objects. The container loads a module by iterating over its `providers` array and calling the normal registration APIs. No decorators or side‑effects are involved, which makes modules easy to test, compose, and tree‑shake.

---

## Defining a module

```typescript
import { defineModule } from 'tsinject';
import { ILogger, ConsoleLogger } from './logger';
import { IDatabase, PostgresDB } from './db';

export const DatabaseModule = defineModule({
  providers: [
    {
      token: ILogger,
      provider: { type: 'class', useClass: ConsoleLogger },
      lifecycle: Lifecycle.Singleton,
    },
    {
      token: IDatabase,
      provider: { type: 'class', useClass: PostgresDB },
      lifecycle: Lifecycle.Singleton,
    },
  ],
  exports: [ILogger, IDatabase],
});
```

- **`providers`** – an array of `ProviderRegistration` objects (see the API reference). Each registration maps a `token` to a `provider` definition and optional lifecycle/tags/dispose.
- **`imports`** – other modules whose providers should be loaded **before** this module’s own providers.
- **`exports`** – a list of tokens that this module considers public. The container does **not** enforce visibility; the list is purely informational for downstream tooling.

---

## Loading a module into a container

```typescript
import { Container } from 'tsinject';
import { DatabaseModule } from './modules/database';
import { AppModule } from './modules/app';

const container = new Container();
container.load(AppModule);   // recursively loads imports (DatabaseModule) first
```

The `Container.load(module)` method:
1. Recursively loads any `module.imports`.
2. Registers each `module.providers` using the container’s `register` API.
3. Returns nothing; the container is now populated.

---

## Why use modules?

- **Pure data** – No side‑effects at import time; modules are just objects.
- **Composable** – You can assemble a tree of modules that represent features, infrastructure, or test fixtures.
- **Tree‑shakable** – Since modules are static data, bundlers can drop unused providers.
- **Framework‑agnostic** – Modules are not tied to any particular web framework; they can be consumed by any host that creates a `Container`.

---

## Typical pattern

```typescript
// src/modules/app.ts
import { defineModule } from 'tsinject';
import { IUserService, UserService } from '../services/user';
import { DatabaseModule } from './database';

export const AppModule = defineModule({
  imports: [DatabaseModule],
  providers: [
    {
      token: IUserService,
      provider: { type: 'class', useClass: UserService },
    },
  ],
});
```

Now the consumer only needs to load `AppModule` – all transitive dependencies (including the database layer) are wired automatically.
