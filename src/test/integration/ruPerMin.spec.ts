﻿import * as assert from "assert";
import { Constants, CosmosClient, Database } from "../../";
import testConfig from "./../common/_testConfig";
import { TestHelpers } from "./../common/TestHelpers";

const endpoint = testConfig.host;
const masterKey = testConfig.masterKey;
const client = new CosmosClient({ endpoint, auth: { masterKey } });

// TODO: these tests are all disabled

describe("RU Per Minute", function () {
    let database: Database;

    // - removes all the databases,
    //  - creates a new database,
    beforeEach(async () => {
        await TestHelpers.removeAllDatabases(client);
        database = await TestHelpers.getTestDatabase(client, "RU Per minute");
    });

    // - removes all the databases,
    afterEach(async () => {
        await TestHelpers.removeAllDatabases(client);
    });

    xit("Create container with RU Per Minute Offer", async function () {
        const containerDefinition = {
            id: "sample col",
        };

        const options = {
            offerEnableRUPerMinuteThroughput: true,
            offerVersion: "V2",
            offerThroughput: 400,
        };

        await database.containers.create(containerDefinition, options);
        const { result: offers } = await client.offers.readAll().toArray();
        assert.equal(offers.length, 1);
        const offer = offers[0];

        assert.equal(offer.offerType, "Invalid");
        assert.notEqual(offer.content, undefined);
        assert.equal(offer.content.offerIsRUPerMinuteThroughputEnabled, true);
    });

    xit("Create container without RU Per Minute Offer", async function () {
        const containerDefinition = {
            id: "sample col",
        };

        const options = {
            offerVersion: "V2",
            offerThroughput: 400,
        };

        await database.containers.create(containerDefinition, options);
        const { result: offers } = await client.offers.readAll().toArray();
        assert.equal(offers.length, 1);
        const offer = offers[0];

        assert.equal(offer.offerType, "Invalid");
        assert.notEqual(offer.content, undefined);
        assert.equal(offer.content.offerIsRUPerMinuteThroughputEnabled, false);
    });

    xit("Create container with RU Per Minute Offer and insert Document with disableRUPerMinuteUsage options",
        async function () {
            const containerDefinition = {
                id: "sample col",
            };

            const options = {
                offerEnableRUPerMinuteThroughput: true,
                offerVersion: "V2",
                offerThroughput: 400,
            };

            await database.containers.create(containerDefinition, options);
            const container = database.container(containerDefinition.id);
            const options2: any = {
                disableRUPerMinuteUsage: true,
            };
            const { headers } = await container.items.create({ id: "sample document" },
                options2);
            assert(headers[Constants.HttpHeaders.IsRUPerMinuteUsed] !== true);

        });
});
