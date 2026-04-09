const __token_brand: unique symbol = Symbol("tsneedle/token");

export interface Token<T> {
  readonly [__token_brand]: typeof __token_brand;
  readonly name: string;
  readonly key: symbol;
}

export function createToken<T>(name: string): Token<T> {
  const key = Symbol(`tsneedle:${name}`);
  return Object.freeze({
    [__token_brand]: __token_brand,
    name,
    key,
  } satisfies Token<T>);
}
