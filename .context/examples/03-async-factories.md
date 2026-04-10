# Example 03 – Async Factories

Illustrates a provider whose factory returns a `Promise`. Use `resolveAsync` to obtain the instance.

```typescript
import { Container, createToken, injectable } from 'tsinject';

// Token for an async‑initialized service
export interface IDataSource {
  getData(): Promise<string[]>;
}
export const IDataSource = createToken<IDataSource>('IDataSource');

// Async factory – imagine reading a file or opening a DB connection
async function createDataSource(): Promise<IDataSource> {
  // Simulate async init (e.g., DB connection)
  await new Promise(r => setTimeout(r, 100));
  return {
    async getData() {
      return ['alpha', 'beta', 'gamma'];
    },
  };
}

const container = new Container();
container.registerFactory(IDataSource, createDataSource);

// Async resolution – must use resolveAsync
(async () => {
  const ds = await container.resolveAsync(IDataSource);
  console.log('Data:', await ds.getData());
})();
```

Attempting `container.resolve(IDataSource)` would throw an `AsyncFactoryError`.
