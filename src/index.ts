export type { Token } from "./token/token.js";
export { createToken } from "./token/token.js";

export { Container } from "./container/container.js";

export { Lifecycle } from "./binding/lifecycle.js";

export type {
  Provider,
  ClassProvider,
  FactoryProvider,
  ValueProvider,
  AliasProvider,
} from "./binding/provider.js";

export type { Binding } from "./binding/binding.js";
export { createBinding } from "./binding/binding.js";
export type { RegisterOptions } from "./binding/register-options.js";

export { injectable } from "./decorators/injectable.js";
export { inject } from "./decorators/inject.js";
export { singleton } from "./decorators/singleton.js";
export { scoped } from "./decorators/scoped.js";
export { optional } from "./decorators/optional.js";
export { lazy } from "./decorators/lazy.js";
export { postConstruct } from "./decorators/post-construct.js";
export { preDestroy } from "./decorators/pre-destroy.js";

export { defineModule } from "./modules/module.js";
export type {
  ModuleDefinition,
  ProviderRegistration,
} from "./modules/module.js";

export type { ResolutionContext } from "./context/resolution-context.js";

export { CircularDependencyError } from "./errors/circular-dependency-error.js";
export { ResolutionError } from "./errors/resolution-error.js";
export { AsyncFactoryError } from "./errors/async-factory-error.js";
export { DisposedContainerError } from "./errors/disposed-container-error.js";

export type { Constructor, InstanceOf } from "./utils/constructor.js";
