import { MetadataRegistry } from "../metadata/metadata-registry.js";
import type { Constructor } from "../utils/constructor.js";

export function optional<T = unknown>(_defaultValue?: T) {
  return (
    target: Constructor<unknown>,
    _context: ClassAccessorDecoratorContext,
  ): void => {
    MetadataRegistry.registerOptional(target, 0);
  };
}
