import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@modules": path.resolve(__dirname, "./src/modules"),
      "@common": path.resolve(__dirname, "./src/modules/common"),
      "@ui": path.resolve(__dirname, "./src/modules/common/components/ui"),
      "@hooks": path.resolve(__dirname, "./src/modules/common/hooks"),
      "@contexts": path.resolve(__dirname, "./src/modules/common/contexts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // El unico test que habia (dashboard-metrics) quedo obsoleto: el dashboard
    // ya se calcula en el servidor. Sin esto, "no test files" hace fallar el CI.
    passWithNoTests: true,
  },
});
