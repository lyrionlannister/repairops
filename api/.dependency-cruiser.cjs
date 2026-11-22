/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      comment: "No circular dependencies between modules.",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "controllers-no-dao-or-orm",
      comment: "Controllers must go through a Service — never call a DAO or TypeORM directly.",
      severity: "error",
      from: { path: "^src/.+/controllers/" },
      to: { path: "(^src/.+/daos/|[\\\\/]node_modules[\\\\/]typeorm)" },
    },
    {
      name: "routes-only-controllers",
      comment: "Routes wire up controllers; they must not reach into services or daos directly.",
      severity: "error",
      from: { path: "^src/.+/routes/" },
      to: { path: "(^src/.+/services/|^src/.+/daos/)" },
    },
    {
      name: "daos-no-upward-deps",
      comment: "DAOs are the bottom layer — they must not import controllers or services.",
      severity: "error",
      from: { path: "^src/.+/daos/" },
      to: { path: "(^src/.+/controllers/|^src/.+/services/)" },
    },
  ],
  options: {
    // TypeScript 7 (compilador nativo) no expone la API JS que dependency-cruiser
    // usa para parsear .ts; sin swc cruza 0 modulos y el gate pasa vacio.
    parser: "swc",
    // swc via dependency-cruiser no activa la sintaxis JSX en .tsx; los unicos
    // .tsx son plantillas de PDF (reporting/pdf), fuera de las capas que se validan.
    exclude: { path: "\\.tsx$" },
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
  },
};
