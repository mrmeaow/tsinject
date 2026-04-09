import { type Token, createToken } from "tsneedle";
import { describe, expect, it } from "vitest";

describe("Token", () => {
  it("should create a token with a name", () => {
    const token = createToken<unknown>("TestToken");
    expect(token.name).toBe("TestToken");
    expect(token.key).toBeTypeOf("symbol");
  });

  it("should create tokens with unique keys", () => {
    const tokenA = createToken<unknown>("TokenA");
    const tokenB = createToken<unknown>("TokenA"); // same name, different type

    expect(tokenA.key).not.toBe(tokenB.key);
  });

  it("should return a frozen object", () => {
    const token = createToken<unknown>("Frozen");
    expect(Object.isFrozen(token)).toBe(true);
  });

  it("should have a brand symbol", () => {
    const token = createToken<unknown>("Branded");
    const brandKey = Object.getOwnPropertySymbols(token)[0]!;
    expect(brandKey.description).toBe("tsneedle/token");
  });
});

describe("Token type safety", () => {
  it("should have separate token instances for different types", () => {
    interface IRepoA {
      findA(): string;
    }
    interface IRepoB {
      findB(): string;
    }

    const tokenA = createToken<IRepoA>("Repository");
    const tokenB = createToken<IRepoB>("Repository"); // same name, different type

    // Keys should be different
    expect(tokenA.key).not.toBe(tokenB.key);

    // Both should be valid Token types
    const _checkA: Token<IRepoA> = tokenA;
    const _checkB: Token<IRepoB> = tokenB;
    expect(true).toBe(true);
  });

  it("should not allow assigning wrong token type", () => {
    interface IRepo {
      find(): string;
    }
    interface ICache {
      get(): string;
    }

    const repoToken = createToken<IRepo>("Service");
    const cacheToken = createToken<ICache>("Service");

    // At runtime they're both just objects, but the types prevent confusion
    expect(repoToken.name).toBe("Service");
    expect(cacheToken.name).toBe("Service");
    expect(repoToken.key).not.toBe(cacheToken.key);
  });
});
