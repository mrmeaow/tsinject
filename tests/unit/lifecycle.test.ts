import { Lifecycle, type RegisterOptions } from "tsneedle";
import { describe, expect, it } from "vitest";

describe("Lifecycle", () => {
  it("should have Singleton value", () => {
    expect(Lifecycle.Singleton).toBe("singleton");
  });

  it("should have Transient value", () => {
    expect(Lifecycle.Transient).toBe("transient");
  });

  it("should have Scoped value", () => {
    expect(Lifecycle.Scoped).toBe("scoped");
  });
});

describe("RegisterOptions", () => {
  it("should accept empty options", () => {
    const options: RegisterOptions = {};
    expect(options).toEqual({});
  });

  it("should accept lifecycle option", () => {
    const options: RegisterOptions = {
      lifecycle: Lifecycle.Singleton,
    };
    expect(options.lifecycle).toBe(Lifecycle.Singleton);
  });

  it("should accept tags option", () => {
    const options: RegisterOptions = {
      tags: ["database", "singleton"],
    };
    expect(options.tags).toEqual(["database", "singleton"]);
  });

  it("should accept dispose callback", async () => {
    let disposed = false;
    const options: RegisterOptions = {
      dispose: async (instance) => {
        disposed = true;
      },
    };

    await options.dispose!({});
    expect(disposed).toBe(true);
  });

  it("should accept sync dispose callback", () => {
    let disposed = false;
    const options: RegisterOptions = {
      dispose: (instance) => {
        disposed = true;
      },
    };

    options.dispose!({});
    expect(disposed).toBe(true);
  });

  it("should allow all options together", () => {
    const options: RegisterOptions = {
      lifecycle: Lifecycle.Scoped,
      tags: ["web", "request"],
      dispose: (instance) => {},
    };

    expect(options.lifecycle).toBe(Lifecycle.Scoped);
    expect(options.tags).toEqual(["web", "request"]);
    expect(options.dispose).toBeTypeOf("function");
  });
});
