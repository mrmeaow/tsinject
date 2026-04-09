import { beforeEach, describe, expect, it } from "vitest";
import { Lifecycle } from "../../src/binding/lifecycle.js";
import { Container } from "../../src/container/container.js";
import {
  type ModuleDefinition,
  defineModule,
} from "../../src/modules/module.js";
import { type Token, createToken } from "../../src/token/token.js";

interface Service {
  greet(): string;
}

interface Repo {
  find(): string;
}

class ServiceImpl implements Service {
  greet() {
    return "Hello";
  }
}

class RepoImpl implements Repo {
  find() {
    return "data";
  }
}

describe("Module Loading", () => {
  let container: Container;
  let serviceToken: Token<Service>;
  let repoToken: Token<Repo>;

  beforeEach(() => {
    container = new Container();
    serviceToken = createToken<Service>("service");
    repoToken = createToken<Repo>("repo");
  });

  it("should register providers from module", () => {
    const module = defineModule({
      providers: [
        {
          token: serviceToken,
          provider: { type: "class", useClass: ServiceImpl },
        },
        { token: repoToken, provider: { type: "class", useClass: RepoImpl } },
      ],
    });

    container.load(module);

    const service = container.resolve(serviceToken);
    expect(service.greet()).toBe("Hello");

    const repo = container.resolve(repoToken);
    expect(repo.find()).toBe("data");
  });

  it("should respect lifecycle from module", () => {
    const module = defineModule({
      providers: [
        {
          token: serviceToken,
          provider: { type: "class", useClass: ServiceImpl },
          lifecycle: Lifecycle.Singleton,
        },
      ],
    });

    container.load(module);

    const service1 = container.resolve(serviceToken);
    const service2 = container.resolve(serviceToken);
    expect(service1).toBe(service2);
  });

  it("should recursively load imported modules", () => {
    const innerModule = defineModule({
      providers: [
        { token: repoToken, provider: { type: "class", useClass: RepoImpl } },
      ],
    });

    const outerModule = defineModule({
      providers: [
        {
          token: serviceToken,
          provider: { type: "class", useClass: ServiceImpl },
        },
      ],
      imports: [innerModule],
    });

    container.load(outerModule);

    expect(container.resolve(serviceToken).greet()).toBe("Hello");
    expect(container.resolve(repoToken).find()).toBe("data");
  });

  it("should use exports field as informational", () => {
    const module = defineModule({
      providers: [
        {
          token: serviceToken,
          provider: { type: "class", useClass: ServiceImpl },
        },
      ],
      exports: [serviceToken],
    });

    container.load(module);
    expect(container.resolve(serviceToken)).toBeDefined();
  });
});
