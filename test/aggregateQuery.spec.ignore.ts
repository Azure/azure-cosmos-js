import assert from "assert";
import stream from "stream";
import _ from "underscore";
import util from "util";
import { Base, DocumentClient, Range } from "../src";
import testConfig from "./_testConfig";
import { TestData } from "./TestData";
import { TestHelpers } from "./TestHelpers";

// var lib = require("../lib/"),
//     assert = require("assert"),
//     testConfig = require("./_testConfig"),
//     Stream = require("stream"),
//     util = require("util"),
//     _ = require("underscore");

// var Base = lib.Base,
//     DocumentClient = lib.DocumentClient,
//     Range = lib.Range

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const host = testConfig.host;
const masterKey = testConfig.masterKey;

describe.skip("NodeJS Aggregate Query Tests", async function () {
    const partitionKey = "key";
    const uniquePartitionKey = "uniquePartitionKey";
    const testdata = new TestData(partitionKey, uniquePartitionKey);

    const collectionDefinition = {
        id: "sample collection",
        indexingPolicy: {
            includedPaths: [
                {
                    path: "/",
                    indexes: [
                        {
                            kind: "Range",
                            dataType: "Number",
                        },
                        {
                            kind: "Range",
                            dataType: "String",
                        },
                    ],
                },
            ],
        },
        partitionKey: {
            paths: [
                "/" + partitionKey,
            ],
            kind: "Hash",
        },
    };

    const collectionOptions = { offerThroughput: 10100 };

    describe("Validate Aggregate Document Query", function () {
        const client = new DocumentClient(host, { masterKey });
        const documentDefinitions = testdata.docs;

        // - removes all the databases,
        //  - creates a new database,
        //      - creates a new collecton,
        //          - bulk inserts documents to the collection
        before(async function () {
            await TestHelpers.removeAllDatabases(host, masterKey);
            const {result: db} = await client.createDatabase({ id: Base.generateGuidId() });
            const {result: coll} = await client.createCollection(
                TestHelpers.getDatabaseLink(true, db), collectionDefinition, collectionOptions);
            await TestHelpers.bulkInsertDocuments(client, isNameBased, db, collection, documentDefinitions);
        });

        const validateResult = function (actualValue, expectedValue) {
            assert.deepEqual(actualValue, expectedValue, "actual value doesn't match with expected value.");
        }

        const validateToArray = function (queryIterator, options, expectedResults, done) {

            ////////////////////////////////
            // validate toArray()
            ////////////////////////////////
            const toArrayVerifier = function (err, results) {
                assert.equal(err, undefined, "unexpected failure in fetching the results: " + JSON.stringify(err));
                assert.equal(results.length, expectedResults.length, "invalid number of results");
                assert.equal(queryIterator.hasMoreResults(), false, "hasMoreResults: no more results is left");

                validateResult(results, expectedResults);
                return done();
            };

            queryIterator.toArray(toArrayVerifier);
        };

        const validateNextItem = function (queryIterator, options, expectedResults, done) {

            ////////////////////////////////
            // validate nextItem()
            ////////////////////////////////

            const results = [];
            const nextItemVerifier = function (err, item) {
                assert.equal(err, undefined, "unexpected failure in fetching the results: " + JSON.stringify(err));
                if (item === undefined) {
                    assert(!queryIterator.hasMoreResults(), "hasMoreResults must signal results exhausted");
                    validateResult(results, expectedResults);

                    return done();
                }
                results = results.concat(item);

                if (results.length < expectedResults.length) {
                    assert(queryIterator.hasMoreResults(), "hasMoreResults must indicate more results");
                }
                return queryIterator.nextItem(nextItemVerifier);
            };

            queryIterator.nextItem(nextItemVerifier);
        };

        const validateNextItemAndCurrentAndHasMoreResults = function (queryIterator, options, expectedResults, done) {
            // curent and nextItem recursively invoke each other till queryIterator is exhausted
            ////////////////////////////////
            // validate nextItem()
            ////////////////////////////////

            const results = [];
            const nextItemVerifier = function (err, item) {

                ////////////////////////////////
                // validate current()
                ////////////////////////////////
                const currentVerifier = function (err, currentItem) {
                    assert.equal(err, undefined, "unexpected failure in fetching the results: " + JSON.stringify(err));
                    assert.equal(item, currentItem, "current must give the previously item returned by nextItem");

                    if (currentItem === undefined) {
                        assert(!queryIterator.hasMoreResults(), "hasMoreResults must signal results exhausted");
                        validateResult(results, expectedResults);

                        return done();
                    }

                    if (results.length < expectedResults.length) {
                        assert(queryIterator.hasMoreResults(), "hasMoreResults must indicate more results");
                    }

                    return queryIterator.nextItem(nextItemVerifier);
                };

                assert.equal(err, undefined, "unexpected failure in fetching the results: " + JSON.stringify(err));

                if (item === undefined) {
                    assert(!queryIterator.hasMoreResults(), "hasMoreResults must signal results exhausted");
                    validateResult(results, expectedResults);

                    return queryIterator.current(currentVerifier);
                }
                results = results.concat(item);

                if (results.length < expectedResults.length) {
                    assert(queryIterator.hasMoreResults(), "hasMoreResults must indicate more results");
                }

                const currentVerifier = function (err, currentItem) {
                    queryIterator.nextItem(nextItemVerifier);
                }

                return queryIterator.current(currentVerifier);
            };
            queryIterator.nextItem(nextItemVerifier);
        };


        const validateExecuteNextAndHasMoreResults = function (queryIterator, options, expectedResults, done) {
            ////////////////////////////////
            // validate executeNext() 
            ////////////////////////////////

            const totalFetchedResults = [];
            const executeNextValidator = function (err, results) {
                assert.equal(err, undefined, "unexpected failure in fetching the results: " + JSON.stringify(err));
                if (results === undefined || (totalFetchedResults.length === expectedResults.length)) {
                    // no more results
                    validateResult(totalFetchedResults, expectedResults);
                    assert.equal(queryIterator.hasMoreResults(), false, "hasMoreResults: no more results is left");
                    assert.equal(results, undefined, "unexpected more results" + JSON.stringify(results));

                    return done();
                }

                totalFetchedResults = totalFetchedResults.concat(results);

                if (totalFetchedResults.length < expectedResults.length) {
                    // there are more results
                    assert.equal(results.length, pageSize, "executeNext: invalid fetch block size");
                    assert(queryIterator.hasMoreResults(), "hasMoreResults expects to return true");
                    return queryIterator.executeNext(executeNextValidator);

                } else {
                    // no more results
                    assert.equal(expectedResults.length, totalFetchedResults.length, "executeNext: didn't fetch all the results");

                    //validate that next execute returns undefined resources
                    return queryIterator.executeNext(executeNextValidator);
                }
            };

            queryIterator.executeNext(executeNextValidator);
        }

        const validateForEach = function (queryIterator, options, expectedResults, done) {

            ////////////////////////////////
            // validate forEach() 
            ////////////////////////////////

            const results = [];
            const callbackSingnalledEnd = false;
            const forEachCallback = function (err, item) {
                assert.equal(err, undefined, "unexpected failure in fetching the results: " + JSON.stringify(err));
                // if the previous invocation returned false, forEach must avoid invoking the callback again!
                assert.equal(callbackSingnalledEnd, false, "forEach called callback after the first false returned");

                // item == undefined means no more results
                if (item !== undefined) {
                    results = results.concat(item);
                }

                if (results.length == expectedResults.length) {
                    callbackSingnalledEnd = true;
                    validateResult(results, expectedResults);
                    process.nextTick(done);
                    return false;
                }
                return true;
            };

            queryIterator.forEach(forEachCallback);
        }

        const executeQueryAndValidateResults = function (collectionLink, query, expectedResults, done) {

            const options = { enableCrossPartitionQuery: true };

            const queryIterator = client.queryDocuments(collectionLink, query, options);

            validateToArray(queryIterator, options, expectedResults,
                function () {
                    queryIterator.reset();
                    validateExecuteNextAndHasMoreResults(queryIterator, options, expectedResults,
                        function () {
                            queryIterator.reset();
                            validateNextItemAndCurrentAndHasMoreResults(queryIterator, options, expectedResults,
                                function () {
                                    validateForEach(queryIterator, options, expectedResults, done);
                                }
                            );
                        }
                    );
                }
            );
        };

        const generateTestConfigs = function () {
            const testConfigs = [];
            const aggregateQueryFormat = "SELECT VALUE %s(r.%s) FROM r WHERE %s";
            const aggregateOrderByQueryFormat = "SELECT VALUE %s(r.%s) FROM r WHERE %s ORDER BY r.%s";
            const aggregateConfigs = [
                {
                    operator: "AVG",
                    expected: sum / numberOfDocumentsWithNumbericId,
                    condition: util.format("IS_NUMBER(r.%s)", partitionKey)
                },
                { operator: "AVG", expected: undefined, condition: "true" },
                { operator: "COUNT", expected: numberOfDocuments, condition: "true" },
                { operator: "MAX", expected: "xyz", condition: "true" },
                { operator: "MIN", expected: null, condition: "true" },
                { operator: "SUM", expected: sum, condition: util.format("IS_NUMBER(r.%s)", partitionKey) },
                { operator: "SUM", expected: undefined, condition: "true" }
            ];


            aggregateConfigs.forEach(function (config) {
                const query = util.format(aggregateQueryFormat, config.operator, partitionKey, config.condition);
                const testName = util.format("%s %s", config.operator, config.condition);
                testConfigs.push({ testName: testName, query: query, expected: config.expected });

                const query = util.format(aggregateOrderByQueryFormat, config.operator, partitionKey, config.condition, partitionKey);
                const testName = util.format("%s %s OrderBy", config.operator, config.condition);
                testConfigs.push({ testName: testName, query: query, expected: config.expected });
            });

            const aggregateSinglePartitionQueryFormat = "SELECT VALUE %s(r.%s) FROM r WHERE r.%s = '%s'";
            const aggregateSinglePartitionQueryFormatSelect = "SELECT %s(r.%s) FROM r WHERE r.%s = '%s'";
            const samePartitionSum = numberOfDocsWithSamePartitionKey * (numberOfDocsWithSamePartitionKey + 1) / 2.0;
            const aggregateSinglePartitionConfigs = [
                { operator: "AVG", expected: samePartitionSum / numberOfDocsWithSamePartitionKey },
                { operator: "COUNT", expected: numberOfDocsWithSamePartitionKey },
                { operator: "MAX", expected: numberOfDocsWithSamePartitionKey },
                { operator: "MIN", expected: 1 },
                { operator: "SUM", expected: samePartitionSum }
            ];

            aggregateSinglePartitionConfigs.forEach(function (config) {
                const query = util.format(aggregateSinglePartitionQueryFormat, config.operator, field, partitionKey, uniquePartitionKey);
                const testName = util.format("%s SinglePartition %s", config.operator, "SELECT VALUE");
                testConfigs.push({ testName: testName, query: query, expected: config.expected });

                query = util.format(aggregateSinglePartitionQueryFormatSelect, config.operator, field, partitionKey, uniquePartitionKey);
                testName = util.format("%s SinglePartition %s", config.operator, "SELECT");
                testConfigs.push({ testName: testName, query: query, expected: { $1: config.expected } });
            });

            return testConfigs;
        }

        generateTestConfigs().forEach(function (test) {
            it(test.testName, function (done) {
                const expected = test.expected === undefined ? [] : [test.expected];
                executeQueryAndValidateResults(getCollectionLink(isNameBased, db, collection), test.query, expected, done);
            });
        });

    });
});
