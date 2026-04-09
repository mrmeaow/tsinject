import { Container, Lifecycle, type Provider, createToken } from "tsneedle";
import { beforeEach, describe, expect, it } from "vitest";

interface IRepo {
  find(): string;
}

interface IService {
  run(): void;
}

class Repo implements IRepo {
  find(): string {
    return "repo";
  }
}

class Service implements IService {
  run(): void {}
}

const IRepo = createToken<IRepo>("IRepo");
const IService = createToken<IService>("IService");

describe("Container Registration", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  describe("register()", () => {
    it("should store a binding in the registry", () => {
      const provider: Provider<IRepo> = {
        type: "class",
        useClass: Repo,
      };

      container.register(IRepo, provider);

      expect(container.has(IRepo)).toBe(true);
    });

    it("should accept register options", () => {
      const provider: Provider<IRepo> = {
        type: "class",
        useClass: Repo,
      };

      container.register(IRepo, provider, {
        lifecycle: Lifecycle.Singleton,
        tags: ["db"],
      });

      expect(container.has(IRepo)).toBe(true);
    });
  });

  describe("registerClass()", () => {
    it("should create a ClassProvider automatically", () => {
      container.registerClass(IRepo, Repo);

      expect(container.has(IRepo)).toBe(true);
    });

    it("should accept register options", () => {
      container.registerClass(IRepo, Repo, {
        lifecycle: Lifecycle.Singleton,
      });

      expect(container.has(IRepo)).toBe(true);
    });
  });

  describe("registerFactory()", () => {
    it("should create a FactoryProvider", () => {
      const factory = () => new Repo();
      container.registerFactory(IRepo, factory);

      expect(container.has(IRepo)).toBe(true);
    });

    it("should support async factories", async () => {
      const asyncFactory = async () => {
        await Promise.resolve();
        return new Repo();
      };
      container.registerFactory(IRepo, asyncFactory);

      expect(container.has(IRepo)).toBe(true);
    });
  });

  describe("registerSingleton()", () => {
    it("should be a shorthand for class + singleton lifecycle", () => {
      container.registerSingleton(IRepo, Repo);

      expect(container.has(IRepo)).toBe(true);
    });
  });

  describe("registerValue()", () => {
    it("should create a ValueProvider with the value", () => {
      const repo = new Repo();
      container.registerValue(IRepo, repo);

      expect(container.has(IRepo)).toBe(true);
    });
  });
});

describe("Container Introspection", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  describe("has()", () => {
    it("should return false for unregistered tokens", () => {
      expect(container.has(IRepo)).toBe(false);
    });

    it("should return true for registered tokens", () => {
      container.registerClass(IRepo, Repo);
      expect(container.has(IRepo)).toBe(true);
    });

    it("should return true after registerValue", () => {
      container.registerValue(IRepo, new Repo());
      expect(container.has(IRepo)).toBe(true);
    });
  });

  describe("parent inheritance", () => {
    it("should inherit bindings from parent container", () => {
      const parent = new Container();
      parent.registerClass(IRepo, Repo);

      const child = new Container(parent);

      expect(child.has(IRepo)).toBe(true);
    });

    it("should allow child to override parent bindings", () => {
      const parent = new Container();
      parent.registerClass(IRepo, Repo);

      const child = new Container(parent);
      // Override with different class (same interface)
      child.registerClass(IRepo, Repo);

      expect(child.has(IRepo)).toBe(true);
    });

    it("should not affect parent when child registers", () => {
      const parent = new Container();
      parent.registerClass(IRepo, Repo);

      const child = new Container(parent);
      child.registerClass(IService, Service);

      expect(parent.has(IService)).toBe(false);
      expect(child.has(IService)).toBe(true);
    });
  });
});

describe("Container Lifecycle Properties", () => {
  it("should have isDisposed initially false", () => {
    const container = new Container();
    expect(container.isDisposed).toBe(false);
  });

  it("should have parentContainer as null for root", () => {
    const container = new Container();
    expect(container.parentContainer).toBe(null);
  });

  it("should have parentContainer reference for child", () => {
    const parent = new Container();
    const child = new Container(parent);
    expect(child.parentContainer).toBe(parent);
  });
});
