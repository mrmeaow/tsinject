import { Lifecycle } from "../binding/lifecycle.js";
import { injectable } from "./injectable.js";

export function scoped() {
  return injectable({ lifecycle: Lifecycle.Scoped });
}
