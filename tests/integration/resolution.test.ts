import {
  Container,
  Lifecycle,
  ResolutionError,
  createToken,
} from "@mrmeaow/tsinject";
import { beforeEach, describe, expect, it } from "vitest";

interface ILogger {
  log(msg: string): void;
}

interface IRepo {
  find(): string;
}

interface IService {
  run(): void;
}

class Logger implements ILogger {
  logs: string[] = [];
  log(msg: string): void {
    this.logs.push(msg);
  }
}

class Repo implements IRepo {
  find(): string {
    return "repo-data";
  }
}

class Service implements IService {
  constructor(private repo: IRepo) {}
  run(): void {
    this.repo.find();
  }
}

const ILogger = createToken<ILogger>("ILogger");
const IRepo = createToken<IRepo>("IRepo");
const IService = createToken<IService>("IService");

describe("Sync Resolution", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  describe("resolve()", () => {
    it("should resolve a registered class provider", () => {
      container.registerClass(IRepo, Repo);
      const repo = container.resolve(IRepo);
      expect(repo.find()).toBe("repo-data");
    });

    it("should resolve a value provider", () => {
      const repo = new Repo();
      container.registerValue(IRepo, repo);
      const resolved = container.resolve(IRepo);
      expect(resolved).toBe(repo);
    });

    it("should resolve an alias provider", () => {
      const repo = new Repo();
      container.registerValue(IRepo, repo);
      const IRepoAlias = createToken<IRepo>("IRepoAlias");
      container.register(IRepoAlias, { type: "alias", useToken: IRepo });

      const resolved = container.resolve(IRepoAlias);
      expect(resolved).toBe(repo);
    });

    it("should resolve a factory provider", () => {
      container.registerFactory(IRepo, () => new Repo());
      const repo = container.resolve(IRepo);
      expect(repo.find()).toBe("repo-data");
    });

    it("should throw ResolutionError for unregistered token", () => {
      expect(() => container.resolve(IRepo)).toThrow(ResolutionError);
    });

    it("should throw for disposed container", async () => {
      container.registerClass(IRepo, Repo);
      await container.dispose();
      expect(() => container.resolve(IRepo)).toThrow();
    });
  });

  describe("Dependency Injection", () => {
    it("should inject constructor dependencies - manual registration required", () => {
      // Manual injection via factory - the @inject decorator isn't implemented yet
      container.registerClass(IRepo, Repo);
      container.registerFactory(
        IService,
        (ctx) => new Service(ctx.resolve(IRepo)),
      );
      const service = container.resolve(IService);
      expect(service.run()).toBeUndefined();
    });

    it("should resolve nested dependencies via factories", () => {
      container.registerClass(IRepo, Repo);
      container.registerClass(ILogger, Logger);
      // Service depends on Repo - manual for now
      container.registerFactory(
        IService,
        (ctx) => new Service(ctx.resolve(IRepo)),
      );
      const service = container.resolve(IService);
      service.run();
    });
  });

  describe("Lifecycle: Transient", () => {
    it("should create new instance each resolve", () => {
      container.registerClass(IRepo, Repo, { lifecycle: Lifecycle.Transient });
      const repo1 = container.resolve(IRepo);
      const repo2 = container.resolve(IRepo);
      expect(repo1).not.toBe(repo2);
    });
  });

  describe("Lifecycle: Singleton", () => {
    it("should cache and return same instance", () => {
      container.registerClass(IRepo, Repo, { lifecycle: Lifecycle.Singleton });
      const repo1 = container.resolve(IRepo);
      const repo2 = container.resolve(IRepo);
      expect(repo1).toBe(repo2);
    });

    it("should cache in root container for child scopes", () => {
      container.registerClass(IRepo, Repo, { lifecycle: Lifecycle.Singleton });
      const child = container.createScope("child");
      const repo1 = container.resolve(IRepo);
      const repo2 = child.resolve(IRepo);
      expect(repo1).toBe(repo2);
    });
  });

  describe("Lifecycle: Scoped", () => {
    it("should cache in scope container", () => {
      container.registerClass(IRepo, Repo, { lifecycle: Lifecycle.Scoped });
      const scope = container.createScope("request1");
      const repo1 = scope.resolve(IRepo);
      const repo2 = scope.resolve(IRepo);
      expect(repo1).toBe(repo2);
    });

    it("should return different instances for different scopes", () => {
      container.registerClass(IRepo, Repo, { lifecycle: Lifecycle.Scoped });
      const scope1 = container.createScope("scope1");
      const scope2 = container.createScope("scope2");
      const repo1 = scope1.resolve(IRepo);
      const repo2 = scope2.resolve(IRepo);
      expect(repo1).not.toBe(repo2);
    });
  });
});

describe("tryResolve()", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  it("should return undefined for unregistered token", () => {
    const result = container.tryResolve(IRepo);
    expect(result).toBeUndefined();
  });

  it("should return instance for registered token", () => {
    container.registerClass(IRepo, Repo);
    const result = container.tryResolve(IRepo);
    expect(result?.find()).toBe("repo-data");
  });
});

describe("Circular Dependency Detection", () => {
  it("should detect direct circular dependency in factory resolution", () => {
    // A depends on B in resolution - create via factories
    const IA = createToken<string>("IA");
    const IB = createToken<string>("IB");

    const resolveB: ((token: typeof IB) => string) | null = null;

    // A factory tries to resolve B, B factory tries to resolve A
    const container = new Container();
    container.registerFactory(IB, (ctx) => {
      // B resolves A, which will try to resolve B again
      return ctx.resolve(IA);
    });
    container.registerFactory(IA, (ctx) => {
      // A resolves B
      return ctx.resolve(IB);
    });

    expect(() => container.resolve(IA)).toThrow();
  });
});
