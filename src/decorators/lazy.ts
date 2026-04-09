import { MetadataRegistry } from "../metadata/metadata-registry.js";
import type { Token } from "../token/token.js";
import type { Constructor } from "../utils/constructor.js";

export function lazy<T>(token: Token<T>) {
  return (
    target: unknown,
    context: ClassFieldDecoratorContext | ClassAccessorDecoratorContext,
  ): void => {
    if (typeof target === "object" && target !== null && "metadata" in target) {
      const meta = target.metadata as Record<string | symbol, unknown>;
      const cls = meta["target"] as Constructor<unknown>;
      MetadataRegistry.registerPropertyInjection(cls, context.name, token);
      MetadataRegistry.markLazyProperty(cls, context.name);
    }
  };
}
