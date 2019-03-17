import resolve from "rollup-plugin-local-resolve";
import replace from "rollup-plugin-replace";

const version = require("./package.json").version;

export default [
  {
    input: "dist-esm/index.js",
    output: {
      file: "dist/index.js",
      format: "umd",
      name: "Microsoft.Azure.Cosmos",
      sourcemap: true
    },
    plugins: [
      resolve(),
      replace({
        REPALCE_WITH_SDK_VERSION: version
      })
    ]
  }
];
