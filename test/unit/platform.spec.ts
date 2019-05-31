import assert from "assert";
import { Constants } from "../../dist-esm/index";

const packageJson = require("../../package.json");

describe("Version", function() {
  it("should have matching constant version & package version", function() {
    const packageVersion = packageJson["version"];
    const constantVersion = Constants.SDKVersion;
    assert.equal(constantVersion, packageVersion, "Package.json and Constants.SDKVersion don't match");
  });
});
