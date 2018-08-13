import localResolve from "rollup-plugin-local-resolve";
import multiEntry from "rollup-plugin-multi-entry";

export default [
  {
    input: "dist-esm/test/**/*.spec.js",
    output: {
      file: "dist-test/index.js",
      format: "umd",
      name: "CosmosClient"
    },
    plugins: [localResolve(), multiEntry({ exports: false })],
    treeshake: false
  },
  {
    input: "dist-esm/index.js",
    output: {
      file: "dist/index.js",
      format: "umd",
      name: "CosmosClient"
    },
    plugins: [localResolve()]
  }
];
