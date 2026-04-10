import type {
  AliasProvider,
  ClassProvider,
  FactoryProvider,
  Provider,
  ValueProvider,
} from "@mrmeaow/tsinject";
import { Lifecycle } from "@mrmeaow/tsinject";
import { createToken } from "@mrmeaow/tsinject";
import { describe, expect, it } from "vitest";

interface IRepo {
  find(): string;
}
interface ICache {
  get(): string;
}

class Repo implements IRepo {
  find(): string {
    return "repo";
  }
}

describe("Provider Types", () => {
  describe("ClassProvider", () => {
    it("should have correct type discriminant", () => {
      const provider: ClassProvider<IRepo> = {
        type: "class",
        useClass: Repo,
      };

      expect(provider.type).toBe("class");
      expect(provider.useClass).toBe(Repo);
    });

    it("should be assignable to Provider<T>", () => {
      const classProvider: ClassProvider<IRepo> = {
        type: "class",
        useClass: Repo,
      };

      const _check: Provider<IRepo> = classProvider;
      expect(_check).toBeDefined();
    });
  });

  describe("FactoryProvider", () => {
    it("should accept sync factory function", () => {
      const factory: FactoryProvider<IRepo> = {
        type: "factory",
        useFactory: () => new Repo(),
      };

      expect(factory.type).toBe("factory");
      expect(factory.useFactory).toBeTypeOf("function");
    });

    it("should accept async factory function", async () => {
      const factory: FactoryProvider<IRepo> = {
        type: "factory",
        useFactory: async () => {
          await Promise.resolve();
          return new Repo();
        },
      };

      const result = await factory.useFactory({} as never);
      expect(result.find()).toBe("repo");
    });

    it("should support explicit inject tokens", () => {
      const IToken = createToken<ICache>("ICache");
      const factory: FactoryProvider<IRepo> = {
        type: "factory",
        useFactory: (ctx) => new Repo(),
        inject: [IToken],
      };

      expect(factory.inject).toHaveLength(1);
      expect(factory.inject?.[0]).toBe(IToken);
    });
  });

  describe("ValueProvider", () => {
    it("should store literal value", () => {
      const instance = new Repo();
      const provider: ValueProvider<IRepo> = {
        type: "value",
        useValue: instance,
      };

      expect(provider.type).toBe("value");
      expect(provider.useValue).toBe(instance);
    });

    it("should work with primitives", () => {
      const provider: ValueProvider<string> = {
        type: "value",
        useValue: "hello",
      };

      expect(provider.useValue).toBe("hello");
    });
  });

  describe("AliasProvider", () => {
    it("should point to another token", () => {
      const targetToken = createToken<ICache>("ICache");
      const provider: AliasProvider<IRepo> = {
        type: "alias",
        useToken: targetToken,
      };

      expect(provider.type).toBe("alias");
      expect(provider.useToken).toBe(targetToken);
    });
  });
});

describe("Provider discriminated union", () => {
  it("should narrow type via discriminator", () => {
    const providers: Provider<IRepo>[] = [
      { type: "class", useClass: Repo },
      { type: "factory", useFactory: () => new Repo() },
      { type: "value", useValue: new Repo() },
      { type: "alias", useToken: createToken<IRepo>("IRepo") },
    ];

    for (const p of providers) {
      switch (p.type) {
        case "class":
          expect(p.useClass).toBe(Repo);
          break;
        case "factory":
          expect(p.useFactory).toBeTypeOf("function");
          break;
        case "value":
          expect(p.useValue).toBeDefined();
          break;
        case "alias":
          expect(p.useToken).toBeDefined();
          break;
      }
    }
  });
});
