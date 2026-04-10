import type { Constructor, InstanceOf } from "@mrmeaow/tsinject";
import { describe, expect, it } from "vitest";

describe("Constructor Types", () => {
  it("should be usable as Constructor<T>", () => {
    class MyService {
      greet(): string {
        return "hello";
      }
    }

    // InstanceOf should extract the instance type
    type Instance = InstanceOf<typeof MyService>;

    // Create actual instance
    const service = new MyService();
    expect(service.greet()).toBe("hello");

    // Type assignment check
    const _typeCheck: Instance = service;
    expect(_typeCheck.greet()).toBe("hello");
  });
});

describe("Constructor type safety", () => {
  it("should accept class constructors", () => {
    class Logger {
      log(msg: string): void {
        console.log(msg);
      }
    }

    const _ctor: Constructor<Logger> = Logger;
    const instance = new _ctor();
    instance.log("test");
    expect(true).toBe(true);
  });
});
