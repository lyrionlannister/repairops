import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    globalSetup: ["tests/global-teardown.ts"],
    fileParallelism: false,
    // Los pools "forks"/"threads" (default) truenan con Node 24 en esta
    // maquina: cualquier describe(), hasta en un archivo vacio sin mocks ni
    // setup, revienta con "Cannot read properties of undefined (reading
    // 'config')" al arrancar el worker. "vmThreads" sí funciona. El
    // package.json pide Node 26 (engines) -- si se actualiza el runtime a
    // esa version, vale la pena volver a probar sin este override.
    pool: "vmThreads",
  },
});
