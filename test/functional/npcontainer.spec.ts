import assert from "assert";
import { CosmosClient, Constants, Container } from "../../dist-esm";
import { removeAllDatabases, getTestContainer } from "../common/TestHelpers";
import { endpoint, masterKey } from "../common/_testConfig";
import { ResourceType, HTTPMethod } from "../../dist-esm/common";

const legacyClient = new CosmosClient({
  endpoint,
  key: masterKey,
  plugins: [
    {
      on: "request",
      plugin: (context, next) => {
        // Intercepts the API request to create a non-partitioned container using an old API version
        if (context.resourceType === ResourceType.container && context.method === HTTPMethod.post) {
          context.body = JSON.stringify({ id: JSON.parse(context.body).id });
        }
        context.headers[Constants.HttpHeaders.Version] = "2018-06-18";
        console.log(context.resourceType, context.method, context.body);
        return next(context);
      }
    }
  ]
});

const client = new CosmosClient({
  endpoint,
  key: masterKey
});

describe("Non Partitioned Container", function() {
  let container: Container;
  before(async () => {
    await removeAllDatabases();
    const npContainer = await getTestContainer("Validate Container CRUD", legacyClient);
    container = client.database(npContainer.database.id).container(npContainer.id);
  });

  it("should handle item CRUD", async () => {
    // read items
    const { resources: items } = await container.items.readAll().fetchAll();
    assert(Array.isArray(items), "Value should be an array");

    // create an item
    console.log("Create");
    const name = "sample document";
    const { resource: item1 } = await container.items.create(
      {
        id: "a",
        name,
        foo: "bar",
        key: "value"
      },
      { partitionKey: [] }
    );

    assert.equal(item1.name, name);

    // upsert an item
    console.log("Upsert");
    const { resource: item2 } = await container.items.upsert(
      {
        id: "b",
        name: "sample document",
        foo: "bar",
        key: "value"
      },
      { partitionKey: [] }
    );
    assert.equal(item2.name, name);

    // replace an item
    console.log("Replace");
    const newProp = "baz";
    const { resource: item3 } = await container.item("a", []).replace({
      id: "a",
      newProp
    });
    assert.equal(item3.newProp, newProp);

    // read documents after creation
    const { resources: documents } = await container.items.readAll({ enableCrossPartitionQuery: true }).fetchAll();
    assert.equal(documents.length, 2, "create should increase the number of documents");

    // query documents
    const { resources: results } = await container.items
      .query("SELECT * FROM root r", { enableCrossPartitionQuery: true })
      .fetchAll();
    assert(results.length === 2, "Container should contain two items");

    // delete a document
    await container.item(item1.id, []).delete();

    // read documents after deletion
    try {
      await container.item(item1.id, []).read();
      assert.fail("must throw if document doesn't exist");
    } catch (err) {
      const notFoundErrorCode = 404;
      assert.equal(err.code, notFoundErrorCode, "response should return error code 404");
    }
  });
});
