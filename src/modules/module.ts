import type { Lifecycle } from "../binding/lifecycle.js";
import type { Provider } from "../binding/provider.js";
import type { Token } from "../token/token.js";

export interface ProviderRegistration {
  readonly token: Token<unknown>;
  readonly provider: Provider<unknown>;
  readonly lifecycle?: Lifecycle;
  readonly tags?: readonly string[];
  readonly dispose?: (instance: unknown) => Promise<void> | void;
}

export interface ModuleDefinition {
  readonly providers: readonly ProviderRegistration[];
  readonly exports?: readonly Token<unknown>[];
  readonly imports?: readonly ModuleDefinition[];
}

export function defineModule(def: ModuleDefinition): ModuleDefinition {
  return def;
}
