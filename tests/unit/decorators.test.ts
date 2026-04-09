import { describe, expect, it } from "vitest";
import { Lifecycle } from "../../src/binding/lifecycle.js";
import { inject } from "../../src/decorators/inject.js";
import { injectable } from "../../src/decorators/injectable.js";
import { lazy } from "../../src/decorators/lazy.js";
import { optional } from "../../src/decorators/optional.js";
import { postConstruct } from "../../src/decorators/post-construct.js";
import { preDestroy } from "../../src/decorators/pre-destroy.js";
import { scoped } from "../../src/decorators/scoped.js";
import { singleton } from "../../src/decorators/singleton.js";
import { createToken } from "../../src/token/token.js";

describe("Decorators - Class", () => {
  describe("@injectable", () => {
    it("should be a function", () => {
      expect(typeof injectable).toBe("function");
    });

    it("should accept options", () => {
      const decorator = injectable({
        lifecycle: Lifecycle.Singleton,
        tags: ["tag1"],
      });
      expect(typeof decorator).toBe("function");
    });
  });

  describe("@singleton", () => {
    it("should be a function", () => {
      expect(typeof singleton).toBe("function");
    });
  });

  describe("@scoped", () => {
    it("should be a function", () => {
      expect(typeof scoped).toBe("function");
    });
  });

  describe("@lazy", () => {
    it("should be a function", () => {
      expect(typeof lazy).toBe("function");
    });

    it("should accept a token", () => {
      const token = createToken<unknown>("test");
      const decorator = lazy(token);
      expect(typeof decorator).toBe("function");
    });
  });
});

describe("Decorators - Parameter", () => {
  describe("@inject", () => {
    it("should be a function", () => {
      expect(typeof inject).toBe("function");
    });

    it("should accept a token", () => {
      const token = createToken<unknown>("test");
      const decorator = inject(token);
      expect(typeof decorator).toBe("function");
    });
  });

  describe("@optional", () => {
    it("should be a function", () => {
      expect(typeof optional).toBe("function");
    });
  });
});

describe("Decorators - Lifecycle", () => {
  describe("@postConstruct", () => {
    it("should be a function", () => {
      expect(typeof postConstruct).toBe("function");
    });
  });

  describe("@preDestroy", () => {
    it("should be a function", () => {
      expect(typeof preDestroy).toBe("function");
    });
  });
});
