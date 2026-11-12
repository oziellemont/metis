import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Agrega el alias «@/» (igual que tsconfig) para poder probar módulos que lo usan, como el middleware.
// Límite por prueba de 20 s: varias pruebas que simulan temporadas completas tardan de 3.5 a 5.1 s en los servidores
// de GitHub y con el límite de fábrica (5 s) fallaban a veces sin que nada estuviera mal. Las pruebas que declaran
// su propio límite lo conservan.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { testTimeout: 20_000 },
});
