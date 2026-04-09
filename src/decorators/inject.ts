import { MetadataRegistry } from "../metadata/metadata-registry.js";
import type { Token } from "../token/token.js";
import type { Constructor } from "../utils/constructor.js";

type DecoratorTarget =
  | undefined
  | {
      kind: "field";
      name: string | symbol;
      metadata: Record<string | symbol, unknown>;
    }
  | {
      kind: "accessor";
      name: string | symbol;
      metadata: Record<string | symbol, unknown>;
    };

type ParameterDecoratorTarget = {
  kind: "method" | "constructor";
  target: Constructor<unknown>;
  index: number;
};

export function inject<T>(token: Token<T>) {
  return (
    target: ParameterDecoratorTarget | DecoratorTarget,
    context: ClassFieldDecoratorContext | ClassAccessorDecoratorContext,
  ): void => {
    if (target === undefined) return;

    if (
      typeof target === "object" &&
      "kind" in target &&
      target.kind === "field"
    ) {
      MetadataRegistry.registerPropertyInjection(
        target.metadata["target"] as Constructor<unknown>,
        target.name,
        token,
      );
      return;
    }

    if (
      typeof target === "object" &&
      "kind" in target &&
      target.kind === "accessor"
    ) {
      MetadataRegistry.registerPropertyInjection(
        target.metadata["target"] as Constructor<unknown>,
        target.name,
        token,
      );
      return;
    }

    if (
      typeof target === "object" &&
      "kind" in target &&
      (target.kind === "method" || target.kind === "constructor")
    ) {
      MetadataRegistry.registerParamToken(target.target, target.index, token);
    }
  };
}
