import type { Provider } from "../binding/provider.js";
import type { Token } from "../token/token.js";
import type { Lifecycle } from "./lifecycle.js";

export interface RegisterOptions {
  readonly lifecycle?: Lifecycle;
  readonly tags?: readonly string[];
  readonly dispose?: (instance: unknown) => Promise<void> | void;
}

export interface BindingOptions extends RegisterOptions {
  readonly token: Token<unknown>;
  readonly provider: Provider<unknown>;
}
