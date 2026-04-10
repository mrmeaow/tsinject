# tsinject Documentation

[![npm version](https://img.shields.io/npm/v/tsinject.svg)](https://www.npmjs.com/package/tsinject)
[![CI status](https://github.com/yourorg/tsinject/actions/workflows/ci.yml/badge.svg)](https://github.com/yourorg/tsinject/actions)

**tsinject** – A sharp, modern, lightweight dependency injection container for TypeScript.

## Install

Both **ESM** and **CommonJS** builds are provided. Node automatically selects the correct entry point based on your project's `type` field.

```bash
npm i tsinject
# or with pnpm
pnpm i tsinject
```

## Quick start

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
} from 'tsinject';

// Define tokens
interface ILogger { log(msg: string): void; }
const ILogger = createToken<ILogger>('ILogger');

// Implement and decorate
@injectable()
class ConsoleLogger implements ILogger {
  log(msg: string) { console.log(msg); }
}

// Register and resolve
const container = new Container();
container.registerClass(ILogger, ConsoleLogger);
const logger = container.resolve(ILogger);
logger.log('hello tsinject');
```

## Documentation

- [Getting Started](./getting-started.md)
- [API Reference](./api-reference.md)
- [Decorators](./decorators.md)
- [Modules](./modules.md)
- [Scoping](./scoping.md)
- [Async Resolution](./async.md)
- [Disposal](./disposal.md)
- [Migrating from tsyringe](./migrating-from-tsyringe.md)
- [Migrating from inversify](./migrating-from-inversify.md)
- [Comparison: tsinject vs tsyringe vs InversifyJS](./comparison.md)

## Examples

See the `examples/` directory for runnable snippets covering basic usage, lifecycles, async factories, modules, testing with mocks, and circular dependencies.
