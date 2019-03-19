// import assert from "assert";
// import * as sinon from "sinon";
// import { CosmosClient } from "../..";
// import { endpoint, masterKey } from "../common/_testConfig";

// describe("NodeJS CRUD Tests", function() {
//   this.timeout(process.env.MOCHA_TIMEOUT || 20000);

//   describe("Validate client beforeOperation hook", function() {
//     it.only("should call a user supplied function", async function() {
//       const client = new CosmosClient({ endpoint, auth: { masterKey } });
//       const fake = sinon.fake((args: any) => Promise.resolve(args));
//       await client.getDatabaseAccount({ beforeOperation: fake });
//       assert.equal(fake.callCount, 1);
//     });
//   });
// });
