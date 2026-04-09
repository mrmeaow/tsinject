import "reflect-metadata";
import { MetadataRegistry } from "./metadata/metadata-registry.js";

export function enableReflectMetadata(): void {
  MetadataRegistry.setReflectMode(true);
}

enableReflectMetadata();
