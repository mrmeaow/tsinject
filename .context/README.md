# tsneedle Documentation

[![npm version](https://img.shields.io/npm/v/tsneedle.svg)](https://www.npmjs.com/package/tsneedle)
[![CI status](https://github.com/yourorg/tsneedle/actions/workflows/ci.yml/badge.svg)](https://github.com/yourorg/tsneedle/actions)

**tsneedle** – A sharp, modern, lightweight dependency injection container for TypeScript.

## Install

Both **ESM** and **CommonJS** builds are provided. Node automatically selects the correct entry point based on your project's `type` field.

```bash
npm i tsneedle
# or with pnpm
pnpm i tsneedle
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
} from 'tsneedle';

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
logger.log('hello tsneedle');
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
- [Comparison: tsneedle vs tsyringe vs InversifyJS](./comparison.md)

## Examples

See the `examples/` directory for runnable snippets covering basic usage, lifecycles, async factories, modules, testing with mocks, and circular dependencies.
