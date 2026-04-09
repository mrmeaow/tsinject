import type { Token } from "../token/token.js";
import { Lifecycle } from "./lifecycle.js";
import type { Provider } from "./provider.js";
import type { RegisterOptions } from "./register-options.js";

export interface Binding<T> {
  readonly token: Token<unknown>;
  readonly provider: Provider<T>;
  readonly lifecycle: Lifecycle;
  readonly tags: readonly string[];
  readonly dispose: ((instance: unknown) => Promise<void> | void) | undefined;
}

export type { RegisterOptions };

export function createBinding<T>(
  token: Token<unknown>,
  provider: Provider<T>,
  options?: RegisterOptions,
): Binding<T> {
  const result: Binding<T> = {
    token,
    provider,
    lifecycle: options?.lifecycle ?? Lifecycle.Transient,
    tags: options?.tags ?? [],
    dispose: options?.dispose,
  };
  return Object.freeze(result);
}
