export class DisposedContainerError extends Error {
  override readonly name = "DisposedContainerError";

  constructor() {
    super("Container has been disposed and can no longer be used.");
  }
}
