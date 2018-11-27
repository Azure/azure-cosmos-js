import resolve from "rollup-plugin-local-resolve";
import replace from "rollup-plugin-replace";
import multiEntry from "rollup-plugin-multi-entry";
import { version } from "./package.json";

console.log(version);

export default [
  {
    input: "dist-esm/test/**/*.spec.js",
    output: {
      file: "dist-test/index.js",
      format: "umd",
      name: "TestCosmosClient",
      sourcemap: true
    },
    plugins: [
      resolve(),
      multiEntry({ exports: false }),
      replace({
        "process.env.VERSION": JSON.stringify(version)
      })
    ],
    treeshake: false
  },
  {
    input: "dist-esm/index.js",
    output: {
      file: "dist/index.js",
      format: "umd",
      name: "CosmosClient",
      sourcemap: true
    },
    plugins: [
      resolve(),
      replace({
        "process.env.VERSION": JSON.stringify(version)
      })
    ]
  }
];
