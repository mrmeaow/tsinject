import { beforeEach, describe, expect, it, vi } from "vitest";
import { Container } from "../../src/container/container.js";
import { type Token, createToken } from "../../src/token/token.js";

interface Service {
  name: string;
}

class ServiceImpl implements Service {
  name = "service";
}

describe("Container Disposal", () => {
  let container: Container;
  let serviceToken: Token<Service>;

  beforeEach(() => {
    container = new Container();
    serviceToken = createToken<Service>("service");
  });

  it("should call custom dispose callback", async () => {
    const disposeFn = vi.fn();
    container.registerClass(serviceToken, ServiceImpl, {
      dispose: disposeFn,
    });

    container.resolve(serviceToken);
    await container.dispose();

    expect(disposeFn).toHaveBeenCalledOnce();
  });

  it("should clear registry after dispose", async () => {
    container.registerClass(serviceToken, ServiceImpl);
    container.resolve(serviceToken);

    await container.dispose();

    expect(container.has(serviceToken)).toBe(false);
    expect(container.isDisposed).toBe(true);
  });

  it("should recursively dispose child scopes", async () => {
    const scope = container.createScope("request");
    const disposeSpy = vi.spyOn(scope, "dispose");

    await container.dispose();

    expect(disposeSpy).toHaveBeenCalled();
  });
});
