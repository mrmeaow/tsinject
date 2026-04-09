import type { Token } from "../token/token.js";

export class CircularDependencyError extends Error {
  override readonly name = "CircularDependencyError";
  readonly chain: readonly Token<unknown>[];
  readonly culprit: Token<unknown>;

  constructor(chain: Token<unknown>[], culprit: Token<unknown>) {
    const formatted = chain.map((t) => t.name).join(" → ");
    super(
      `Circular dependency detected:\n\n  ${formatted} → ${culprit.name}\n  ${" ".repeat(formatted.length)}${"^".repeat(culprit.name.length)}\n\nHint: Use @lazy() or @inject(Token) @optional() to break the cycle.`,
    );
    this.chain = chain;
    this.culprit = culprit;
  }
}
