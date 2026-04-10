# Getting Started

This guide walks through a minimal **tsinject** setup: installing the package, defining tokens, creating injectable classes, registering them, and resolving instances.

## 1. Install

```bash
pnpm i tsinject   # or npm install tsinject
```

tsinject ships both **ESM** and **CommonJS** builds. Node picks the right one automatically via the `exports` field in `package.json`.

```typescript
// ESM (default)
import { Container, createToken } from 'tsinject';

// CommonJS
const { Container, createToken } = require('tsinject');
```

## 2. Define tokens

Tokens are the typed identifiers used by the container. They carry a phantom generic that guarantees type safety.

```typescript
import { createToken } from 'tsinject';

// Example interface
interface ILogger {
  log(message: string): void;
}

// Create a token that represents ILogger
export const ILogger = createToken<ILogger>('ILogger');
```

## 3. Implement and decorate classes

Use the `@injectable()` decorator (or `@singleton()` for a singleton lifecycle) to mark a class as resolvable by the container.

```typescript
import { injectable } from 'tsinject';

@injectable()
export class ConsoleLogger implements ILogger {
  log(message: string) {
    console.log(message);
  }
}
```

If a class depends on other tokens, inject them via the constructor parameter decorator `@inject(Token)`.

```typescript
import { injectable, inject } from 'tsinject';
import { ILogger } from './logger-token';

@injectable()
export class UserService {
  constructor(@inject(ILogger) private logger: ILogger) {}

  getUser(id: string) {
    this.logger.log(`Fetching user ${id}`);
    // ...fetch logic
  }
}
```

## 4. Register bindings

Create a container and register your tokens with the appropriate providers.

```typescript
import { Container } from 'tsinject';
import { ILogger, ConsoleLogger } from './logger';
import { IUserService, UserService } from './user-service';

const container = new Container();

// Register the concrete implementation for ILogger
container.registerClass(ILogger, ConsoleLogger);

// Register the concrete implementation for IUserService
container.registerClass(IUserService, UserService);
```

## 5. Resolve and use

Once registered, you can synchronously resolve instances. For async factories, use `resolveAsync`.

```typescript
const logger = container.resolve(ILogger);
logger.log('Hello, tsinject!');

const userService = container.resolve(IUserService);
userService.getUser('123');
```

## 6. Scoping & lifecycles (optional)

If you need per‑request scoped instances or singletons, use the lifecycle options or the `@singleton()` shorthand.

```typescript
import { Lifecycle } from 'tsinject';

container.registerClass(ILogger, ConsoleLogger, { lifecycle: Lifecycle.Singleton });
```

## 7. Disposal (optional)

When you are done with a container (e.g., at server shutdown), call `await container.dispose();` to run `@preDestroy` hooks and clean up resources.

```typescript
await container.dispose();
```

That’s the full minimal workflow.  The remaining documentation sections dive deeper into each feature.
