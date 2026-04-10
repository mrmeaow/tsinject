# Example 06 – Circular Dependencies

A minimal case where two services depend on each other. Without `@lazy`, tsinject would throw a `CircularDependencyError`. Using `@lazy` defers resolution until first use, breaking the cycle.

```typescript
import { Container, createToken, injectable, lazy, inject } from 'tsinject';

// Tokens
export const IServiceA = createToken<IServiceA>('IServiceA');
export const IServiceB = createToken<IServiceB>('IServiceB');

interface IServiceA { getName(): string; }
interface IServiceB { getName(): string; }

@injectable()
export class ServiceA implements IServiceA {
  // Lazy injection prevents eager resolution of ServiceB during ServiceA construction
  @lazy() @inject(IServiceB) private serviceB!: IServiceB;

  getName() {
    return 'A → ' + this.serviceB.getName();
  }
}

@injectable()
export class ServiceB implements IServiceB {
  constructor(@inject(IServiceA) private serviceA: IServiceA) {}

  getName() {
    return 'B → ' + this.serviceA.getName();
  }
}

// Bootstrap container
const container = new Container();
container.registerClass(IServiceA, ServiceA);
container.registerClass(IServiceB, ServiceB);

// Resolve one side – the lazy decorator stops infinite recursion
const a = container.resolve(IServiceA);
console.log('Result:', a.getName()); // prints something like "A → B → A → …" until the lazy guard stops after the first cycle, then throws CircularDependencyError with a helpful hint.
```

If you remove `@lazy` from `ServiceA`, the container will throw `CircularDependencyError` with a diagnostic chain showing the loop.
