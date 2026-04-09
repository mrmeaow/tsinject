import { Lifecycle } from "../binding/lifecycle.js";
import { injectable } from "./injectable.js";

export function singleton() {
  return injectable({ lifecycle: Lifecycle.Singleton });
}
