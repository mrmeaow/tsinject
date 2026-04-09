import { MetadataRegistry } from "../metadata/metadata-registry.js";
import type { Constructor } from "../utils/constructor.js";

export function postConstruct() {
  return (target: unknown, context: ClassMethodDecoratorContext): void => {
    if (typeof target === "function") {
      MetadataRegistry.registerPostConstruct(
        target as Constructor<unknown>,
        context.name,
      );
    }
  };
}
