# TDD Roadmap – tsneedle DI Container

This document maps the implementation to test-driven development phases. Each phase follows the pattern: **write failing tests → implement → green → refactor**.

---

## Phase 1: Core Primitives (Token & Types)

**Goal**: Establish the foundational types that the entire library relies upon.

### 1.1 Token System

**Tests to write:**
- `tests/unit/token.test.ts`
  - `createToken` returns an object with `name` and `key` properties
  - `createToken` returns a frozen object
  - Two tokens with same name have unique `key` symbols
  - Token cannot be constructed directly (type-level guarantee)
  - Branded type prevents `Token<A>` from being assignable to `Token<B>`

**Implementation**: `src/token/token.ts`

### 1.2 Constructor Types

**Tests to write:**
- `tests/unit/constructor.test.ts`
  - `Constructor<T>` accepts any class constructor signature
  - `InstanceOf<C>` correctly extracts instance type
  - `ConstructorParametersOf<C>` extracts parameter types

**Implementation**: `src/utils/constructor.ts`

---

## Phase 2: Binding & Registration

**Goal**: Define how providers are attached to tokens and stored.

### 2.1 Provider Types

**Tests to write:**
- `tests/unit/provider.test.ts`
  - `ClassProvider` has correct `type` discriminant
  - `FactoryProvider` accepts sync and async factory functions
  - `ValueProvider` stores a literal value
  - `AliasProvider` points to another token

**Implementation**: `src/binding/provider.ts`

### 2.2 Lifecycle & Register Options

**Tests to write:**
- `tests/unit/lifecycle.test.ts`
  - `Lifecycle` enum has all three values
  - `RegisterOptions` accepts optional lifecycle, tags, dispose callback

**Implementation**: `src/binding/lifecycle.ts`, `src/binding/register-options.ts`

### 2.3 Binding Creation

**Tests to write:**
- `tests/unit/binding.test.ts`
  - `createBinding` returns a frozen binding object
  - Binding stores token, provider, lifecycle, tags, dispose

**Implementation**: `src/binding/binding.ts`

---

## Phase 3: Container Core

**Goal**: Build the container class with registration methods.

### 3.1 Container Registration

**Tests to write:**
- `tests/integration/registration.test.ts`
  - `register` stores a binding in the registry
  - `registerClass` creates a `ClassProvider` automatically
  - `registerFactory` creates a `FactoryProvider`
  - `registerSingleton` shorthand works
  - `registerValue` creates a `ValueProvider`

**Implementation**: `src/container/container.ts` (registration methods)

### 3.2 Token Lookup & Introspection

**Tests to write:**
- `tests/integration/introspection.test.ts`
  - `has(token)` returns true for registered tokens
  - `has(token)` returns false for unregistered tokens
  - Registry is inherited from parent container
  - Child can override parent bindings

**Implementation**: `src/container/container.ts` (lookup logic)

---

## Phase 4: Resolution Engine

**Goal**: Implement the core resolution algorithm with circular dependency detection.

### 4.1 Sync Resolution

**Tests to write:**
- `tests/integration/resolution-sync.test.ts`
  - `resolve(token)` returns an instance of the registered provider
  - Resolving a class provider calls the constructor with dependencies
  - Resolving a value provider returns the literal value
  - Resolving an alias provider follows to the target token
  - Throws `ResolutionError` when token not found
  - Throws `CircularDependencyError` when cycle detected

**Implementation**: `src/container/resolution.ts`

### 4.2 Dependency Injection

**Tests to write:**
- `tests/integration/dependency-injection.test.ts`
  - Constructor parameters are resolved from metadata
  - `@inject(Token)` is respected
  - `@optional()` returns undefined for missing deps
  - Property injection works for decorated fields

**Implementation**: `src/container/resolution.ts` + `src/metadata/metadata-registry.ts`

### 4.3 Lifecycle: Transient

**Tests to write:**
- `tests/integration/lifecycle-transient.test.ts`
  - Transient creates a new instance each `resolve()`
  - Two `resolve()` calls return different object references

**Implementation**: resolution logic

### 4.4 Lifecycle: Singleton

**Tests to write:**
- `tests/integration/lifecycle-singleton.test.ts`
  - First `resolve()` creates and caches instance
  - Subsequent `resolve()` returns the cached instance
  - Singleton is cached in root container, not scope

**Implementation**: resolution logic + cache handling

### 4.5 Lifecycle: Scoped

**Tests to write:**
- `tests/integration/lifecycle-scoped.test.ts`
  - Instance is cached in the scope container
  - Different scopes get different instances
  - Scoped can resolve singletons from root

**Implementation**: resolution logic + scope handling

---

## Phase 5: Async Resolution

**Goal**: Support async factories and lifecycle hooks.

### 5.1 Async Factory Resolution

**Tests to write:**
- `tests/integration/async-factory.test.ts`
  - `resolveAsync` works with sync factories (returns Promise<T>)
  - `resolveAsync` works with async factories (awaited)
  - `resolve(token)` throws `AsyncFactoryError` on async factory

**Implementation**: `src/container/resolution-async.ts`

### 5.2 Async Lifecycle Hooks

**Tests to write:**
- `tests/integration/async-lifecycle.test.ts`
  - `@postConstruct` is called after construction (sync and async)
  - `@preDestroy` is called on container disposal
  - Disposal order is reverse of registration

**Implementation**: resolution hooks + disposal logic

---

## Phase 6: Decorators

**Goal**: Implement all class and parameter decorators.

### 6.1 Class Decorators

**Tests to write:**
- `tests/unit/decorators-class.test.ts`
  - `@injectable()` marks class as injectable with Transient default
  - `@injectable({ lifecycle: Lifecycle.Singleton })` works
  - `@singleton()` is shorthand for singleton injectable
  - `@scoped()` is shorthand for scoped injectable
  - Metadata is stored in `MetadataRegistry`

**Implementation**: `src/decorators/injectable.ts`, `singleton.ts`, `scoped.ts`

### 6.2 Parameter Decorators

**Tests to write:**
- `tests/unit/decorators-param.test.ts`
  - `@inject(Token)` stores token for parameter position
  - `@optional()` marks parameter as optional
  - `@optional(defaultValue)` uses default when unresolved
  - Decorators are stored in `MetadataRegistry`

**Implementation**: `src/decorators/inject.ts`, `optional.ts`

### 6.3 Property Decorators

**Tests to write:**
- `tests/unit/decorators-property.test.ts`
  - `@inject(Token)` works on class properties
  - Property is injected after construction

**Implementation**: `src/decorators/inject.ts` (property variant)

### 6.4 Lifecycle Hooks

**Tests to write:**
- `tests/unit/decorators-lifecycle.test.ts`
  - `@postConstruct()` registers a method to run after init
  - `@preDestroy()` registers a method to run on disposal

**Implementation**: `src/decorators/post-construct.ts`, `pre-destroy.ts`

### 6.5 Lazy Resolution

**Tests to write:**
- `tests/unit/decorators-lazy.test.ts`
  - `@lazy()` defers resolution until first property access
  - Prevents eager circular dependency errors

**Implementation**: `src/decorators/lazy.ts` + resolution logic

---

## Phase 7: Scopes & Hierarchy

**Goal**: Implement hierarchical container scoping.

### 7.1 Scope Creation

**Tests to write:**
- `tests/integration/scopes.test.ts`
  - `createScope(name)` returns a child Container
  - Child inherits parent registry
  - Child can override parent bindings

**Implementation**: `src/container/scope.ts`

### 7.2 Scoped Lifecycle in Hierarchy

**Tests to write:**
- `tests/integration/scoped-hierarchy.test.ts`
  - Scoped instances live in scope cache
  - Root singletons are shared across all scopes
  - Disposing scope disposes its scoped instances

**Implementation**: scope + resolution integration

---

## Phase 8: Modules

**Goal**: Support declarative module composition.

### 8.1 Module Definition

**Tests to write:**
- `tests/unit/module.test.ts`
  - `defineModule` returns the input as-is (identity function)
  - Module stores providers, imports, exports

**Implementation**: `src/modules/module.ts`

### 8.2 Module Loading

**Tests to write:**
- `tests/integration/module-loading.test.ts`
  - `container.load(module)` registers all providers
  - Recursively loads imported modules first
  - `exports` field is informational (not enforced)

**Implementation**: `Container.load()` method

---

## Phase 9: Disposal

**Goal**: Implement graceful container teardown.

### 9.1 Disposal Pipeline

**Tests to write:**
- `tests/integration/disposal.test.ts`
  - `dispose()` calls all `@preDestroy` hooks
  - Calls custom `dispose` callbacks from options
  - Processes in reverse registration order
  - Continues even if one disposal throws (logs error)
  - Clears registry, cache, disposables
  - Recursively disposes child scopes

**Implementation**: `src/container/disposal.ts`

---

## Phase 10: Reflect Metadata Bridge

**Goal**: Optional integration with reflect-metadata.

### 10.1 Auto-Inference

**Tests to write:**
- `tests/compatibility/reflect-metadata/auto-inference.test.ts`
  - Importing `tsneedle/reflect` enables reflect mode
  - When enabled, falls back to `design:paramtypes` for missing `@inject`
  - Only works for concrete classes, not interfaces

**Implementation**: `src/reflect.ts` + resolution fallback

---

## Phase 11: Error Handling

**Goal**: Ensure all error paths are tested.

### 11.1 Error Classes

**Tests to write:**
- `tests/unit/errors.test.ts`
  - `CircularDependencyError` includes chain and culprit
  - `ResolutionError` includes token name and registered tokens list
  - `AsyncFactoryError` includes helpful hint
  - `DisposedContainerError` is thrown after dispose

**Implementation**: `src/errors/*.ts`

---

## Test File Map

```
tests/
├── unit/
│   ├── token.test.ts           # Phase 1.1
│   ├── constructor.test.ts     # Phase 1.2
│   ├── provider.test.ts        # Phase 2.1
│   ├── lifecycle.test.ts       # Phase 2.2
│   ├── binding.test.ts         # Phase 2.3
│   ├── decorators-class.test.ts      # Phase 6.1
│   ├── decorators-param.test.ts       # Phase 6.2
│   ├── decorators-property.test.ts   # Phase 6.3
│   ├── decorators-lifecycle.test.ts   # Phase 6.4
│   ├── decorators-lazy.test.ts       # Phase 6.5
│   ├── module.test.ts         # Phase 8.1
│   └── errors.test.ts         # Phase 11.1
│
├── integration/
│   ├── registration.test.ts    # Phase 3.1
│   ├── introspection.test.ts   # Phase 3.2
│   ├── resolution-sync.test.ts      # Phase 4.1
│   ├── dependency-injection.test.ts # Phase 4.2
│   ├── lifecycle-transient.test.ts  # Phase 4.3
│   ├── lifecycle-singleton.test.ts  # Phase 4.4
│   ├── lifecycle-scoped.test.ts     # Phase 4.5
│   ├── async-factory.test.ts   # Phase 5.1
│   ├── async-lifecycle.test.ts # Phase 5.2
│   ├── scopes.test.ts          # Phase 7.1
│   ├── scoped-hierarchy.test.ts # Phase 7.2
│   ├── module-loading.test.ts # Phase 8.2
│   ├── disposal.test.ts       # Phase 9.1
│   └── circular-dependencies.test.ts # Phase 4.1
│
├── types/
│   ├── token-types.ts          # Compile-time type checks
│   ├── provider-types.ts       # Compile-time type checks
│   └── container-types.ts      # Compile-time type checks
│
└── compatibility/
    └── reflect-metadata/
        └── auto-inference.test.ts # Phase 10.1
```

---

## Execution Order

1. **Phase 1–2**: Write all unit tests for primitives. Implement code until green.
2. **Phase 3–4**: Write integration tests for registration + sync resolution.
3. **Phase 5**: Add async resolution tests.
4. **Phase 6**: Write all decorator tests.
5. **Phase 7–9**: Scopes, modules, disposal.
6. **Phase 10**: Compatibility layer.
7. **Phase 11**: Error edge cases.
8. **Final**: Full test coverage run, type checks, lint, build verification.

---

## Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode (TDD workflow)
pnpm test:watch

# Run only unit tests
pnpm vitest run tests/unit

# Run only integration tests
pnpm vitest run tests/integration
```

---

*This plan is the authoritative guide for implementing tsneedle via TDD. Update as implementation reveals new insights.*