import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Solo agrega el alias «@/» (igual que tsconfig) para poder probar módulos que lo usan, como el middleware.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
