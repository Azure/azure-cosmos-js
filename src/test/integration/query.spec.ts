import * as assert from "assert";
import { CosmosClient, UriFactory } from "../../";
import { PartitionKind } from "../../documents";
import testConfig from "./../common/_testConfig";
import { TestHelpers } from "./../common/TestHelpers";

const host = testConfig.host;
const masterKey = testConfig.masterKey;

const doc = { id: "myId", pk: "pk" };

describe("ResourceLink Trimming of leading and trailing slashes", function () {
    this.timeout(10000);
    const client = new CosmosClient({ endpoint: host, auth: { masterKey } });
    const databaseId = "testDatabase";
    const containerId = "testcontainer";

    afterEach(async function () { await TestHelpers.removeAllDatabases(client); });
    beforeEach(async function () { await TestHelpers.removeAllDatabases(client); });

    it("validate correct execution of query using named container link with leading and trailing slashes"
        , async function () {
            const containerDefinition = {
                id: containerId,
                partitionKey: {
                    paths: ["/pk"],
                    kind: PartitionKind.Hash,
                },
            };
            const containerOptions = { offerThroughput: 10100 };

            const container = await TestHelpers.getTestContainer(
                client, "validate correct execution of query", containerDefinition, containerOptions);

            await container.items.create(doc);
            const query = "SELECT * from " + containerId;
            const queryOptions = { partitionKey: "pk" };
            const queryIterator = container.items.query(query, queryOptions);

            const { result } = await queryIterator.toArray();
            assert.equal(result[0]["id"], "myId");
        });
});
