import localResolve from "rollup-plugin-local-resolve";

export default [
  {
    input: "dist-esm/index.js",
    output: {
      file: "dist/index.js",
      format: "umd",
      name: "CosmosClient",
      sourcemap: true
    },
    plugins: [localResolve()]
  }
];
