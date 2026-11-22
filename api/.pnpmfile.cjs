// typescript-eslint aun no soporta TypeScript 7 (tsgo es nativo y no expone la API JS
// que necesita el lint con tipos). Solo sus paquetes resuelven TS 6; tsc y el build
// siguen en la version del proyecto.
const LINT_TYPESCRIPT = "6.0.3";
const usesLintTypescript = (name) =>
  name === "typescript-eslint" || name.startsWith("@typescript-eslint/") || name === "ts-api-utils";

module.exports = {
  hooks: {
    readPackage(pkg) {
      if (usesLintTypescript(pkg.name) && pkg.peerDependencies?.typescript) {
        delete pkg.peerDependencies.typescript;
        pkg.dependencies = { ...pkg.dependencies, typescript: LINT_TYPESCRIPT };
      }
      return pkg;
    },
  },
};
