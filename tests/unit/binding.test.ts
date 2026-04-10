import {
  type Binding,
  Lifecycle,
  type Provider,
  type RegisterOptions,
  createToken,
} from "@mrmeaow/tsinject";
import { describe, expect, it, vi } from "vitest";

interface IRepo {
  find(): string;
}

class Repo implements IRepo {
  find(): string {
    return "repo";
  }
}

describe("Binding", () => {
  it("should create a binding with class provider", () => {
    const token = createToken<IRepo>("IRepo");
    const provider: Provider<IRepo> = {
      type: "class",
      useClass: Repo,
    };

    const binding = createBinding(token, provider);

    expect(binding.token).toBe(token);
    expect(binding.provider).toBe(provider);
    expect(binding.lifecycle).toBe(Lifecycle.Transient);
    expect(binding.tags).toEqual([]);
    expect(binding.dispose).toBeUndefined();
  });

  it("should apply register options", () => {
    const token = createToken<IRepo>("IRepo");
    const provider: Provider<IRepo> = {
      type: "value",
      useValue: new Repo(),
    };
    const options: RegisterOptions = {
      lifecycle: Lifecycle.Singleton,
      tags: ["db", "singleton"],
      dispose: vi.fn(),
    };

    const binding = createBinding(token, provider, options);

    expect(binding.lifecycle).toBe(Lifecycle.Singleton);
    expect(binding.tags).toEqual(["db", "singleton"]);
    expect(binding.dispose).toBe(options.dispose);
  });

  it("should default to transient lifecycle", () => {
    const token = createToken<IRepo>("IRepo");
    const provider: Provider<IRepo> = { type: "class", useClass: Repo };

    const binding = createBinding(token, provider);

    expect(binding.lifecycle).toBe(Lifecycle.Transient);
  });

  it("should default empty tags", () => {
    const token = createToken<IRepo>("IRepo");
    const provider: Provider<IRepo> = { type: "class", useClass: Repo };

    const binding = createBinding(token, provider);

    expect(binding.tags).toEqual([]);
  });

  it("should return a frozen object", () => {
    const token = createToken<IRepo>("IRepo");
    const provider: Provider<IRepo> = { type: "class", useClass: Repo };

    const binding = createBinding(token, provider);

    expect(Object.isFrozen(binding)).toBe(true);
  });
});

describe("Binding type", () => {
  it("should match Binding<T> interface", () => {
    const token = createToken<IRepo>("IRepo");
    const provider: Provider<IRepo> = { type: "class", useClass: Repo };

    const binding: Binding<IRepo> = createBinding(token, provider);

    expect(binding.provider.type).toBe("class");
  });
});

// Helper function - need to import from binding module
import { createBinding } from "@mrmeaow/tsinject";
