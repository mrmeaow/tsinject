import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    typecheck: {
      include: ["tests/types/**/*.ts"],
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/index.ts",
        "src/reflect.ts",
        "src/**/index.ts",
        "src/utils/**",
      ],
      thresholds: {
        branches: 70,
        functions: 50,
        lines: 40,
        statements: 40,
      },
    },
  },
});
