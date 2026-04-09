import { Lifecycle } from "../binding/lifecycle.js";
import { MetadataRegistry } from "../metadata/metadata-registry.js";
import type { Constructor } from "../utils/constructor.js";

export interface InjectableMeta {
  lifecycle: Lifecycle;
  tags: string[];
}

export function injectable(options?: {
  lifecycle?: Lifecycle;
  tags?: string[];
}) {
  return <T extends Constructor<unknown>>(
    target: T,
    context: ClassDecoratorContext<T>,
  ): T => {
    const meta: InjectableMeta = {
      lifecycle: options?.lifecycle ?? Lifecycle.Transient,
      tags: options?.tags ?? [],
    };
    MetadataRegistry.registerInjectable(target, meta);
    return target;
  };
}
