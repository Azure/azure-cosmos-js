import localResolve from "rollup-plugin-local-resolve";
import multiEntry from "rollup-plugin-multi-entry";
import json from "rollup-plugin-json";

export default [
  {
    input: "dist-esm/src/test/**/*.spec.js",
    output: {
      file: "dist-test/index.js",
      format: "umd",
      name: "TestCosmosClient",
      sourcemap: true
    },
    plugins: [localResolve(), multiEntry({ exports: false }), json()],
    treeshake: false
  },
  {
    input: "dist-esm/src/index.js",
    output: {
      file: "dist/index.js",
      format: "umd",
      name: "CosmosClient",
      sourcemap: true
    },
    plugins: [localResolve(), json()]
  }
];
