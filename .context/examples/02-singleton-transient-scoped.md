# Example 02 – Lifecycle: Singleton, Transient, Scoped

Shows how to control object lifetimes using `Lifecycle` options and the `@singleton`/`@scoped` decorators.

```typescript
import { Container, createToken, injectable, singleton, scoped, Lifecycle } from 'tsneedle';

// Tokens
export const IDCounter = createToken<number>('IDCounter');
export const IRequestId = createToken<string>('IRequestId');

// Singleton service – one instance for the whole app
@singleton()
export class IdGenerator {
  private next = 1;
  generate() { return this.next++; }
}

// Scoped request‑level service – new per request scope
@scoped()
export class RequestContext {
  constructor(public readonly requestId: string) {}
}

// Transient service – fresh instance on every resolve
@injectable({ lifecycle: Lifecycle.Transient })
export class RandomNumberService {
  value = Math.random();
}

// Container setup
const root = new Container();
root.registerClass(IdGenerator, IdGenerator);               // singleton via decorator
root.registerClass(RequestContext, RequestContext);         // scoped via decorator
root.registerClass(RandomNumberService, RandomNumberService); // transient via option

// Resolve singleton – same instance everywhere
const gen1 = root.resolve(IdGenerator);
const gen2 = root.resolve(IdGenerator);
console.log('Singleton same?', gen1 === gen2); // true

// Create two request scopes
const requestA = root.createScope('req‑A');
const requestB = root.createScope('req‑B');

// Resolve scoped service – distinct per scope
const ctxA = requestA.resolve(IRequestId);
const ctxB = requestB.resolve(IRequestId);
console.log('Scoped different?', ctxA !== ctxB);

// Resolve transient – new each time
const rand1 = root.resolve(RandomNumberService);
const rand2 = root.resolve(RandomNumberService);
console.log('Transient different?', rand1 !== rand2);
```

The example demonstrates how lifecycles affect instance sharing across scopes.
