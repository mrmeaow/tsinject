# Example 01 – Basic Usage

A minimal demonstration of token creation, registration, and synchronous resolution.

```typescript
import { Container, createToken, injectable } from 'tsinject';

// 1️⃣ Define a token for an interface
export interface ILogger { log(msg: string): void; }
export const ILogger = createToken<ILogger>('ILogger');

// 2️⃣ Implement a concrete class and mark it injectable
@injectable()
export class ConsoleLogger implements ILogger {
  log(msg: string) {
    console.log(msg);
  }
}

// 3️⃣ Setup the container and register the class
const container = new Container();
container.registerClass(ILogger, ConsoleLogger);

// 4️⃣ Resolve and use the logger
const logger = container.resolve(ILogger);
logger.log('Hello, tsinject!');
```

Run with `ts-node` or compile with `tsc` and execute the generated JavaScript.
