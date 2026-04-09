import { describe, expect, it } from "vitest";
import { Container } from "../../src/container/container.js";
import { AsyncFactoryError } from "../../src/errors/async-factory-error.js";
import { CircularDependencyError } from "../../src/errors/circular-dependency-error.js";
import { DisposedContainerError } from "../../src/errors/disposed-container-error.js";
import { ResolutionError } from "../../src/errors/resolution-error.js";
import { type Token, createToken } from "../../src/token/token.js";

describe("Error Classes", () => {
  describe("CircularDependencyError", () => {
    it("should include chain and culprit", () => {
      const tokenA = createToken<unknown>("A");
      const tokenB = createToken<unknown>("B");
      const tokenC = createToken<unknown>("C");

      const error = new CircularDependencyError([tokenA, tokenB], tokenC);

      expect(error.message).toContain("Circular");
      expect(error.message).toContain("C");
    });
  });

  describe("ResolutionError", () => {
    it("should include token name and registered tokens", () => {
      const token = createToken<unknown>("MissingToken");
      const knownToken = createToken<unknown>("known");

      const error = new ResolutionError(token, [], ["known"]);

      expect(error.message).toContain("MissingToken");
      expect(error.message).toContain("known");
    });
  });

  describe("AsyncFactoryError", () => {
    it("should include helpful hint", () => {
      const token = createToken<unknown>("AsyncService");
      const error = new AsyncFactoryError(token);

      expect(error.message).toContain("async");
      expect(error.message).toContain("resolveAsync");
    });
  });

  describe("DisposedContainerError", () => {
    it("should be thrown after dispose", async () => {
      const container = new Container();
      const token = createToken<unknown>("Service");
      container.registerClass(token, class {});

      await container.dispose();

      expect(() => container.resolve(token)).toThrow(DisposedContainerError);
    });
  });
});
