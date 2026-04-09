# Scoping

`tsneedle` supports **hierarchical scopes** that let you share singletons across the whole application while keeping request‑level (or custom) scoped instances isolated.

---

## Diagram

```text
┌─────────────── Root Container ───────────────┐
│  [Singleton Cache]                             │
│  ILogger ──► ConsoleLogger instance           │
│  IConfig ──► Config instance                   │
│                                                │
│  ┌──────── Request Scope "req-1" ──────────┐  │
│  │  [Scoped Cache]                           │  │
│  │  IRequestContext ──► RequestContext #1    │  │
│  │  IAuthService ──► AuthService #1          │  │
│  │                                           │  │
│  │  ┌───── Child Scope ───────────────┐     │  │
│  │  │  (e.g., per‑subrequest)          │     │  │
│  │  └──────────────────────────────────┘     │  │
│  └───────────────────────────────────────────┘  │
│                                                │
│  ┌──────── Request Scope "req-2" ──────────┐  │
│  │  IRequestContext ──► RequestContext #2    │  │
│  └───────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

---

## Rules (summary)

1. **Singletons** are always cached in the **root** container, regardless of which scope resolves them.
2. **Scoped** instances are cached in the **scope** where they are first resolved.
3. **Transient** instances are never cached – a fresh instance is created on every resolution.
4. Child scopes **inherit** all bindings from their parent.
5. Child scopes can **override** parent bindings by re‑registering a token in the child.

---

## Usage example

```typescript
const root = new Container();
root.registerSingleton(ILogger, ConsoleLogger);
root.registerScoped(IRequestContext, RequestContext);

const scope1 = root.createScope('request-1');
const scope2 = root.createScope('request-2');

// Singletons: same instance everywhere
root.resolve(ILogger) === scope1.resolve(ILogger); // true

// Scoped: same instance within a scope, different across scopes
scope1.resolve(IRequestContext) !== scope2.resolve(IRequestContext); // true
scope1.resolve(IRequestContext) === scope1.resolve(IRequestContext); // true
```

The `createScope` method returns a child `Container` that shares the parent’s registry but maintains its own cache for scoped lifetimes.
