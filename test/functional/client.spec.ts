import assert from "assert";
import { Agent } from "http";
import { CosmosClient } from "../../dist-esm";
import { endpoint, masterKey } from "../common/_testConfig";
import { getTestDatabase, getTestContainer } from "../common/TestHelpers";
import { AbortController } from "abort-controller";

describe("NodeJS CRUD Tests", function() {
  this.timeout(process.env.MOCHA_TIMEOUT || 20000);

  describe("Validate client request timeout", function() {
    it("nativeApi Client Should throw exception", async function() {
      // making timeout 1 ms to make sure it will throw
      // (create database request takes 10ms-15ms to finish on emulator)
      const client = new CosmosClient({ endpoint, key: masterKey, connectionPolicy: { requestTimeout: 1 } });
      // create database
      try {
        await getTestDatabase("request timeout", client);
        assert.fail("Must throw when trying to connect to database");
      } catch (err) {
        assert.equal(err.name, "TimeoutError", "client should throw exception");
      }
    });
  });

  describe("Constructor", function() {
    it("Accepts node Agent", function() {
      const client = new CosmosClient({
        endpoint: "https://faaaaaake.com",
        agent: new Agent()
      });
      assert.ok(client !== undefined, "client shouldn't be undefined if it succeeded");
    });
    it("Accepts a connection string", function() {
      const client = new CosmosClient(`AccountEndpoint=${endpoint};AccountKey=${masterKey};`);
      assert.ok(client !== undefined, "client shouldn't be undefined if it succeeded");
    });
    it("throws on a bad connection string", function() {
      assert.throws(() => new CosmosClient(`bad;Connection=string;`));
    });
  });
  describe("Validate user passed AbortController.signal", function() {
    it("should throw exception if aborted during the request", async function() {
      const client = new CosmosClient({ endpoint, key: masterKey });
      const start = Date.now();
      try {
        const controller = new AbortController();
        const signal = controller.signal;
        setTimeout(() => controller.abort(), 5);
        await client.getDatabaseAccount({ abortSignal: signal });
        assert.fail("Must throw when trying to connect to database");
      } catch (err) {
        console.log(Date.now() - start);
        assert.equal(err.name, "AbortError", "client should throw exception");
      }
    });
    it("should throw exception if passed an already aborted signal", async function() {
      const client = new CosmosClient({ endpoint, key: masterKey });
      try {
        const controller = new AbortController();
        const signal = controller.signal;
        controller.abort();
        await client.getDatabaseAccount({ abortSignal: signal });
        assert.fail("Must throw when trying to connect to database");
      } catch (err) {
        assert.equal(err.name, "AbortError", "client should throw exception");
      }
    });
    it("should abort a query", async function() {
      const container = await getTestContainer("abort query");
      try {
        const controller = new AbortController();
        const signal = controller.signal;
        setTimeout(() => controller.abort(), 10);
        await container.items.query("SELECT * from c", { abortSignal: signal }).fetchAll();
        assert.fail("Must throw");
      } catch (err) {
        assert.equal(err.name, "AbortError", "client should throw exception");
      }
    });
  });
});
