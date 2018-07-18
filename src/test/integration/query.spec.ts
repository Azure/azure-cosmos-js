import * as assert from "assert";
import { Constants, CosmosClient, FeedOptions, UriFactory } from "../../";
import { PartitionKind } from "../../documents";
import testConfig from "./../common/_testConfig";
import { getTestContainer, removeAllDatabases } from "./../common/TestHelpers";

const endpoint = testConfig.host;
const masterKey = testConfig.masterKey;

const doc = { id: "myId", pk: "pk" };

describe("ResourceLink Trimming of leading and trailing slashes", function() {
  this.timeout(10000);
  const client = new CosmosClient({ endpoint, auth: { masterKey } });
  const containerId = "testcontainer";

  beforeEach(async function() {
    await removeAllDatabases(client);
  });

  it("validate correct execution of query using named container link with leading and trailing slashes", async function() {
    const containerDefinition = {
      id: containerId,
      partitionKey: {
        paths: ["/pk"],
        kind: PartitionKind.Hash
      }
    };
    const containerOptions = { offerThroughput: 10100 };

    const container = await getTestContainer(
      client,
      "validate correct execution of query",
      containerDefinition,
      containerOptions
    );

    await container.items.create(doc);
    const query = "SELECT * from " + containerId;
    const queryOptions = { partitionKey: "pk" };
    const queryIterator = container.items.query(query, queryOptions);

    const { result } = await queryIterator.toArray();
    assert.equal(result[0]["id"], "myId");
  });
});

describe("Test Query Metrics On Single Partition Collection", function() {
  const client = new CosmosClient({ endpoint, auth: { masterKey } });
  const databaseId = "query metrics test db";
  const collectionId = "testCollection2";

  const testQueryMetricsOnSinglePartition = async function(document: any) {
    try {
      const databaseBody = { id: databaseId };
      const databaseDef = await client.databases.create(databaseBody);
      const database = client.database(databaseDef.id);

      const collectionDefinition = { id: collectionId };
      const collectionOptions = { offerThroughput: 4000 };

      const createdCollectionDef = await database.containers.create(collectionDefinition, collectionOptions);
      const createdContainer = database.container(createdCollectionDef.id);

      await createdContainer.items.create(document);
      const collectionLink = "/dbs/" + databaseId + "/colls/" + collectionId + "/";
      const query = "SELECT * from " + collectionId;
      const queryOptions: FeedOptions = { populateQueryMetrics: true };
      const queryIterator = createdContainer.items.query(query, queryOptions);

      while (queryIterator.hasMoreResults()) {
        const { result: results, headers } = await queryIterator.executeNext();

        if (results === undefined) {
          // no more results
          break;
        }

        assert.notEqual(headers[Constants.HttpHeaders.QueryMetrics]["0"], null);
      }
    } catch (err) {
      throw err;
    }
  };

  afterEach(async function() {
    await removeAllDatabases(client);
  });

  beforeEach(async function() {
    await removeAllDatabases(client);
  });

  it("validate that query metrics are correct for a single partition query", async function() {
    await testQueryMetricsOnSinglePartition(doc);
  });
});
