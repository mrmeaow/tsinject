import type { Token } from "../token/token.js";

export class AsyncFactoryError extends Error {
  override readonly name = "AsyncFactoryError";
  readonly token: Token<unknown>;

  constructor(token: Token<unknown>) {
    super(
      `Attempted synchronous resolution of "${token.name}" which has an async factory.\n\nHint: Use container.resolveAsync("${token.name}") instead of container.resolve().`,
    );
    this.token = token;
  }
}
