import type { Token } from "../token/token.js";

export class ResolutionError extends Error {
  override readonly name = "ResolutionError";
  readonly token: Token<unknown>;
  readonly containerPath: readonly string[];

  constructor(
    token: Token<unknown>,
    containerPath: string[],
    registered?: string[],
  ) {
    const scope =
      containerPath.length > 0 ? ` (scope: ${containerPath.join(" → ")})` : "";
    super(
      `No binding found for token "${token.name}"${scope}\n\n${
        registered?.length
          ? `Registered tokens:\n  ${registered.map((t) => `• ${t}`).join("\n  ")}\n\n`
          : ""
      }Hint: Did you forget to register "${token.name}" in this container?`,
    );
    this.token = token;
    this.containerPath = containerPath;
  }
}
