import type { Container } from "../container/container.js";
import type { Token } from "../token/token.js";

export interface ResolutionContext {
  resolve<T>(token: Token<T>): T;
  resolveAsync<T>(token: Token<T>): Promise<T>;
  tryResolve<T>(token: Token<T>): T | undefined;
  tryResolveAsync<T>(token: Token<T>): Promise<T | undefined>;
  readonly container: Container;
  readonly scope: Container;
  readonly tags: ReadonlySet<string>;
}

export function createResolutionContext(
  container: Container,
): ResolutionContext {
  return {
    resolve: <T>(token: Token<T>): T => container.resolve(token),
    resolveAsync: <T>(token: Token<T>): Promise<T> =>
      container.resolveAsync(token),
    tryResolve: <T>(token: Token<T>): T | undefined =>
      container.tryResolve(token),
    tryResolveAsync: <T>(token: Token<T>): Promise<T | undefined> =>
      container.tryResolveAsync(token),
    container,
    scope: container,
    tags: new Set(),
  };
}
