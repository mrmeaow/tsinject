import { MetadataRegistry } from "../metadata/metadata-registry.js";
import type { Constructor } from "../utils/constructor.js";

export function preDestroy() {
  return (target: unknown, context: ClassMethodDecoratorContext): void => {
    if (context.kind === "method") {
      const proto =
        typeof target === "function"
          ? target.prototype
          : (target as { constructor: Constructor<unknown> }).constructor;
      MetadataRegistry.registerPreDestroy(proto, context.name);
    }
  };
}
