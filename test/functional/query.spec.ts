import assert from "assert";
import { Constants, CosmosClient, PartitionKind } from "../../dist-esm";
import { Container } from "../../dist-esm/client";
import { endpoint, masterKey } from "../common/_testConfig";
import { bulkInsertItems, getTestContainer, getTestDatabase, removeAllDatabases } from "../common/TestHelpers";

const client = new CosmosClient({ endpoint, auth: { masterKey } });

// TODO: This is required for Node 6 and above, so just putting it in here.
// Might want to decide on only supporting async iterators once Node supports them officially.
if (!Symbol || !Symbol.asyncIterator) {
  (Symbol as any).asyncIterator = Symbol.for("Symbol.asyncIterator");
}

describe("Queries", function() {
  this.timeout(process.env.MOCHA_TIMEOUT || 10000);
  before(async function() {
    await removeAllDatabases();
  });

  describe("Query CRUD", function() {
    it("nativeApi Should do queries CRUD operations successfully name based", async function() {
      // create a database
      const database = await getTestDatabase("query test database");
      // query databases
      const querySpec0 = {
        query: "SELECT * FROM root r WHERE r.id=@id",
        parameters: [
          {
            name: "@id",
            value: database.id
          }
        ]
      };
      const { resources: results } = await client.databases.query(querySpec0).fetchAll();
      assert(results.length > 0, "number of results for the query should be > 0");
      const querySpec1 = {
        query: "SELECT * FROM root r WHERE r.id='" + database.id + "'"
      };
      const { resources: results2 } = await client.databases.query(querySpec1).fetchAll();
      assert(results2.length > 0, "number of results for the query should be > 0");
      const querySpec2 = "SELECT * FROM root r WHERE r.id='" + database.id + "'";
      const { resources: results3 } = await client.databases.query(querySpec2).fetchAll();
      assert(results3.length > 0, "number of results for the query should be > 0");
    });
  });

  describe("QueryIterator", function() {
    this.timeout(process.env.MOCHA_TIMEOUT || 30000);
    let resources: { container: Container; doc1: any; doc2: any; doc3: any };

    before(async function() {
      const container = await getTestContainer("Validate QueryIterator Functionality", client);
      const { resource: doc1 } = await container.items.create({ id: "doc1", prop1: "value1" });
      const { resource: doc2 } = await container.items.create({ id: "doc2", prop1: "value2" });
      const { resource: doc3 } = await container.items.create({ id: "doc3", prop1: "value3" });
      resources = { container, doc1, doc2, doc3 };
    });

    it("toArray", async function() {
      const queryIterator = resources.container.items.readAll({ maxItemCount: 2 });
      const { resources: docs } = await queryIterator.fetchAll();
      assert.equal(docs.length, 3, "queryIterator should return all documents using continuation");
      assert.equal(docs[0].id, resources.doc1.id);
      assert.equal(docs[1].id, resources.doc2.id);
      assert.equal(docs[2].id, resources.doc3.id);
    });

    it("asyncIterator", async function() {
      const queryIterator = resources.container.items.readAll({ maxItemCount: 2 });
      let counter = 0;
      for await (const { resources: docs } of queryIterator.getAsyncIterator()) {
        if (counter === 0) {
          assert.equal(docs[0].id, resources.doc1.id, "first document should be doc1");
          assert.equal(docs[1].id, resources.doc2.id, "second document should be doc2");
        } else {
          assert.equal(docs[0].id, resources.doc3.id, "third document should be doc3");
        }
        counter++;
      }
      assert(counter === 2, "iterator should have run 3 times");
    });

    it("executeNext", async function() {
      let queryIterator = resources.container.items.readAll({ maxItemCount: 2 });
      const firstResponse = await queryIterator.fetchNext();

      assert(firstResponse.requestCharge > 0, "RequestCharge has to be non-zero");
      assert.equal(firstResponse.resources.length, 2, "first batch size should be 2");
      assert.equal(firstResponse.resources[0].id, resources.doc1.id, "first batch first document should be doc1");
      assert.equal(firstResponse.resources[1].id, resources.doc2.id, "batch first second document should be doc2");
      const { resources: docs2 } = await queryIterator.fetchNext();
      assert.equal(docs2.length, 1, "second batch size is unexpected");
      assert.equal(docs2[0].id, resources.doc3.id, "second batch element should be doc3");

      // TODO: Continuation tokens are no longer returned by fetchNext because it goes down the pipelines execution context path - stfaul
      // // validate Iterator.executeNext with continuation token
      // queryIterator = resources.container.items.readAll({
      //   maxItemCount: 2,
      //   continuation: firstResponse.continuation as string
      // });
      // const secondResponse = await queryIterator.fetchNext();
      // assert(secondResponse.requestCharge > 0, "RequestCharge has to be non-zero");
      // assert.equal(secondResponse.resources.length, 1, "second batch size with continuation token is unexpected");
      // assert.equal(secondResponse.resources[0].id, resources.doc3.id, "second batch element should be doc3");
    });
  });
});
