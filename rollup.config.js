import resolve from "rollup-plugin-local-resolve";
import json from "rollup-plugin-json";
import replace from "rollup-plugin-replace";
import multiEntry from "rollup-plugin-multi-entry";
import { version } from "./package.json";

export default [
  {
    input: "dist-esm/test/**/*.spec.js",
    output: {
      file: "dist-test/index.js",
      format: "umd",
      name: "Microsoft.Azure.CosmosTest",
      sourcemap: true
    },
    plugins: [resolve(), multiEntry({ exports: false }), json()],
    treeshake: false
  },
  {
    input: "dist-esm/src/index.js",
    output: {
      file: "dist/index.js",
      format: "umd",
      name: "Microsoft.Azure.Cosmos",
      sourcemap: true
    },
    plugins: [resolve(), json()]
  }
];
