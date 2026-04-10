# Example 05 – Testing with Mocks

Shows a Vitest unit test that replaces a dependency with a mock implementation using `tsinject`'s container.

```typescript
import { describe, it, expect, vi } from 'vitest';
import { Container, createToken, injectable } from 'tsinject';

// ==== Production code ==== //
export interface ILogger { log(msg: string): void; }
export const ILogger = createToken<ILogger>('ILogger');

@injectable()
export class Greeter {
  constructor(@inject(ILogger) private logger: ILogger) {}

  greet(name: string) {
    const msg = `Hello, ${name}!`;
    this.logger.log(msg);
    return msg;
  }
}

// ==== Test ==== //
describe('Greeter', () => {
  it('calls logger with the greeting', () => {
    // 1️⃣ Create a mock logger
    const mockLog = vi.fn();
    const mockLogger = { log: mockLog } as ILogger;

    // 2️⃣ Register the mock in a fresh container
    const container = new Container();
    container.registerValue(ILogger, mockLogger);

    // 3️⃣ Resolve the class under test
    const greeter = container.resolve(Greeter);

    // 4️⃣ Exercise and assert
    const result = greeter.greet('World');
    expect(result).toBe('Hello, World!');
    expect(mockLog).toHaveBeenCalledOnce();
    expect(mockLog).toHaveBeenCalledWith('Hello, World!');
  });
});
```

Running `pnpm test` will execute this spec. The test demonstrates how the container makes swapping implementations trivial.
