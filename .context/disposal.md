# Disposal Architecture

When a container is no longer needed (e.g., server shutdown or request‑scope cleanup), you should call `await container.dispose();`. The disposal system ensures:

1. **Lifecycle hooks** (`@preDestroy`) are executed.
2. **Custom `dispose` callbacks** supplied via `RegisterOptions.dispose` are run.
3. **Reverse‑order** execution – disposables are processed like a stack, mirroring typical resource‑release semantics.
4. **Error isolation** – a failure in one disposal handler does not prevent the remaining disposables from running; the error is logged to `console.error`.
5. **Recursive child‑scope disposal** – any scopes created via `container.createScope()` are automatically disposed after the parent.

---

## Implementation snapshot

```typescript
class Container {
  private disposalStack: Array<{
    token: Token<any>;
    instance: any;
    dispose?: (instance: any) => Promise<void> | void;
    preDestroy?: string | symbol;
  }> = [];

  async dispose(): Promise<void> {
    if (this._disposed) return;
    this._disposed = true;

    // Dispose in REVERSE registration order (like stack unwinding)
    for (const entry of [...this.disposalStack].reverse()) {
      try {
        if (entry.dispose) {
          await entry.dispose(entry.instance);
        } else if (entry.preDestroy) {
          await entry.instance[entry.preDestroy]();
        }
      } catch (err) {
        // Don't let one disposal failure stop others
        // Log but continue
        console.error(
          `tsinject: Error disposing "${entry.token.name}": ${err}`
        );
      }
    }

    // Clear all state
    this.registry.clear();
    this.cache.clear();
    this.disposalStack.length = 0;

    // Dispose child scopes
    for (const child of this.scopes.values()) {
      await child.dispose();
    }
  }
}
```

---

## How to add a disposable

When registering a provider, you can supply a `dispose` callback via `RegisterOptions`:

```typescript
container.registerValue(MyResourceToken, new MyResource(), {
  dispose: async (instance) => await instance.cleanup(),
});
```

Alternatively, implement a method on the class and decorate it with `@preDestroy()`:

```typescript
@injectable()
class Cache {
  @preDestroy()
  async close() {
    await this.client.disconnect();
  }
}
```

Both approaches will have their callbacks executed during `container.dispose()`.
