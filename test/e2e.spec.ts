import * as assert from "assert";
import * as Stream from "stream";
import {
    AzureDocuments, Base, Constants, CosmosClient,
    DocumentBase, HashPartitionResolver, Range,
    RangePartitionResolver, Response, RetryOptions,
} from "../src";
import testConfig from "./_testConfig";
import { TestHelpers } from "./TestHelpers";

// Used for sproc
declare var getContext: any;
// declare var body: (input?: any) => void; // TODO: remove this if it's not necessary

// TODO: should fix long lines
// tslint:disable:max-line-length

const host = testConfig.host;
const masterKey = testConfig.masterKey;

describe("NodeJS CRUD Tests", function () {
    this.timeout(process.env.MOCHA_TIMEOUT || 10000);
    // remove all databases from the endpoint before each test
    beforeEach(async function () {
        this.timeout(10000);
        try {
            await TestHelpers.removeAllDatabases(host, masterKey);
        } catch (err) {
            throw err;
        }
    });

    describe("Validate Database CRUD", async function () {
        const databaseCRUDTest = async function (isNameBased: boolean) {
            try {
                const client = new CosmosClient(host, { masterKey });
                // read databases
                const { result: databases } = await client.readDatabases().toArray();
                assert.equal(databases.constructor, Array, "Value should be an array");
                // create a database
                const beforeCreateDatabasesCount = databases.length;
                const databaseDefinition = { id: "sample database" };
                const { result: db } = await client.createDatabase(databaseDefinition);
                assert.equal(db.id, databaseDefinition.id);
                // read databases after creation
                const { result: databases2 } = await client.readDatabases().toArray();
                assert.equal(databases2.length, beforeCreateDatabasesCount + 1,
                    "create should increase the number of databases");
                // query databases
                const querySpec = {
                    query: "SELECT * FROM root r WHERE r.id=@id",
                    parameters: [
                        {
                            name: "@id",
                            value: databaseDefinition.id,
                        },
                    ],
                };
                const { result: results } = await client.queryDatabases(querySpec).toArray();
                assert(results.length > 0, "number of results for the query should be > 0");

                // delete database
                const { result: res } = await client.deleteDatabase(TestHelpers.getDatabaseLink(isNameBased, db));
                try {
                    // read database after deletion
                    const { result: database3 } =
                        await client.readDatabase(TestHelpers.getDatabaseLink(isNameBased, db));
                    assert.fail("Read database on non-existent database should fail");
                } catch (err) {
                    const notFoundErrorCode = 404;
                    assert.equal(err.code, notFoundErrorCode, "response should return error code 404");
                }
            } catch (err) {
                throw err;
            }
        };

        it("nativeApi Should do database CRUD operations successfully name based", async function () {
            try {
                await databaseCRUDTest(true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do database CRUD operations successfully rid based", async function () {
            try {
                await databaseCRUDTest(false);
            } catch (err) {
                throw err;
            }
        });
    });

    describe("Validate Queries CRUD", function () {
        const queriesCRUDTest = async function (isNameBased: boolean) {
            try {
                const client = new CosmosClient(host, { masterKey });
                // create a database
                const databaseDefinition = { id: "sample database" };
                const { result: db } = await client.createDatabase(databaseDefinition);
                assert.equal(db.id, databaseDefinition.id);
                // query databases
                const querySpec0 = {
                    query: "SELECT * FROM root r WHERE r.id=@id",
                    parameters: [
                        {
                            name: "@id",
                            value: databaseDefinition.id,
                        },
                    ],
                };
                const { result: results } = await client.queryDatabases(querySpec0).toArray();
                assert(results.length > 0, "number of results for the query should be > 0");
                const querySpec1 = {
                    query: "SELECT * FROM root r WHERE r.id='" + databaseDefinition.id + "'",
                };
                const { result: results2 } = await client.queryDatabases(querySpec1).toArray();
                assert(results2.length > 0, "number of results for the query should be > 0");
                const querySpec2 = "SELECT * FROM root r WHERE r.id='" + databaseDefinition.id + "'";
                const { result: results3 } = await client.queryDatabases(querySpec2).toArray();
                assert(results3.length > 0, "number of results for the query should be > 0");
            } catch (err) {
                throw err;
            }
        };

        it("nativeApi Should do queries CRUD operations successfully name based", async function () {
            try {
                await queriesCRUDTest(true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do queries CRUD operations successfully rid based", async function () {
            try {
                await queriesCRUDTest(false);
            } catch (err) {
                throw err;
            }
        });
    });

    describe("Validate Collection CRUD", function () {
        const collectionCRUDTest = async function (isNameBased: boolean, hasPartitionKey: boolean) {
            try {
                const client = new CosmosClient(host, { masterKey });
                // create database
                const { result: db } = await client.createDatabase({ id: "sample database" });
                const { result: emptyColls } = await client.readCollections(
                    TestHelpers.getDatabaseLink(isNameBased, db)).toArray();
                assert(Array.isArray(emptyColls), "Value should be an array");
                // create a collection
                const beforeCreateCollectionsCount = emptyColls.length;
                const collectionDefinition: any = {
                    id: "sample collection",
                    indexingPolicy: { indexingMode: "Consistent" },
                };

                if (hasPartitionKey) {
                    collectionDefinition.partitionKey = { paths: ["/id"], kind: DocumentBase.PartitionKind.Hash };
                }

                const { result: collection } = await client.createCollection(
                    TestHelpers.getDatabaseLink(isNameBased, db), collectionDefinition);
                assert.equal(collectionDefinition.id, collection.id);
                assert.equal("consistent", collection.indexingPolicy.indexingMode);
                assert.equal(JSON.stringify(collection.partitionKey),
                    JSON.stringify(collectionDefinition.partitionKey));
                // read collections after creation
                const { result: collections } = await client.readCollections(
                    TestHelpers.getDatabaseLink(isNameBased, db)).toArray();

                assert.equal(collections.length, beforeCreateCollectionsCount + 1,
                    "create should increase the number of collections");
                // query collections
                const querySpec = {
                    query: "SELECT * FROM root r WHERE r.id=@id",
                    parameters: [
                        {
                            name: "@id",
                            value: collectionDefinition.id,
                        },
                    ],
                };
                const { result: results } = await client.queryCollections(
                    TestHelpers.getDatabaseLink(isNameBased, db), querySpec).toArray();
                assert(results.length > 0, "number of results for the query should be > 0");

                // Replacing indexing policy is allowed.
                collection.indexingPolicy.indexingMode = "Lazy";
                const { result: replacedCollection } = await client.replaceCollection(
                    TestHelpers.getCollectionLink(isNameBased, db, collection), collection);
                assert.equal("lazy", replacedCollection.indexingPolicy.indexingMode);

                // Replacing partition key is not allowed.
                try {
                    collection.partitionKey = { paths: ["/key"], kind: DocumentBase.PartitionKind.Hash };
                    const { result: badUpdate } = await client.replaceCollection(
                        TestHelpers.getCollectionLink(isNameBased, db, collection), collection);
                    assert.fail("Replacing paritionkey must throw");
                } catch (err) {
                    const badRequestErrorCode = 400;
                    assert.equal(err.code, badRequestErrorCode,
                        "response should return error code " + badRequestErrorCode);
                } finally {
                    collection.partitionKey = collectionDefinition.partitionKey; // Resume partition key
                }
                // Replacing id is not allowed.
                try {
                    collection.id = "try_to_replace_id";
                    const { result: badUpdate } = await client.replaceCollection(
                        TestHelpers.getCollectionLink(isNameBased, db, collection), collection);
                    assert.fail("Replacing collection id must throw");
                } catch (err) {
                    if (isNameBased) {
                        const notFoundErrorCode = 404;
                        assert.equal(err.code, notFoundErrorCode, "response should return error code 404");
                    } else {
                        const badRequestErrorCode = 400;
                        assert.equal(err.code, badRequestErrorCode, "response should return error code 400");
                    }
                }

                // read collection
                collection.id = collectionDefinition.id;  // Resume Id.
                const { result: readcollection } = await client.readCollection(
                    TestHelpers.getCollectionLink(isNameBased, db, collection));
                assert.equal(collectionDefinition.id, readcollection.id);
                // delete collection
                const { result: res } = await client.deleteCollection(
                    TestHelpers.getCollectionLink(isNameBased, db, collection));
                // read collection after deletion
                try {
                    const { result: deletedcollection } = await client.readCollection(
                        TestHelpers.getCollectionLink(isNameBased, db, collection));
                } catch (err) {
                    const notFoundErrorCode = 404;
                    assert.equal(err.code, notFoundErrorCode, "response should return error code 404");
                }
            } catch (err) {
                throw err;
            }
        };

        const badPartitionKeyDefinitionTest = async function (isNameBased: boolean) {
            try {
                const client = new CosmosClient(host, { masterKey });
                // create database
                const { result: db } = await client.createDatabase({ id: "sample database" });
                // create a collection
                const collectionDefinition = {
                    id: "sample collection",
                    indexingPolicy: { indexingMode: "Consistent" },
                    partitionKey: { paths: "/id", kind: DocumentBase.PartitionKind.Hash },
                };

                try {
                    const { result: collection } = await client.createCollection(
                        TestHelpers.getDatabaseLink(isNameBased, db), collectionDefinition);
                } catch (err) {
                    assert.equal(err.code, 400);
                }
            } catch (err) {
                throw err;
            }
        };

        it("nativeApi Should do collection CRUD operations successfully name based", async function () {
            try {
                await collectionCRUDTest(true, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do collection CRUD operations successfully rid based", async function () {
            try {
                await collectionCRUDTest(false, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do elastic collection CRUD operations successfully name based", async function () {
            try {
                await collectionCRUDTest(true, true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do elastic collection CRUD operations successfully rid based", async function () {
            try {
                await collectionCRUDTest(false, true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Collection with bad partition key definition name based", async function () {
            try {
                await badPartitionKeyDefinitionTest(true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Collection with bad partition key definition name based", async function () {
            try {
                await badPartitionKeyDefinitionTest(false);
            } catch (err) {
                throw err;
            }
        });
    });

    describe("Validate Document CRUD", function () {
        const documentCRUDTest = async function (isNameBased: boolean, isUpsertTest: boolean) {
            try {
                const client = new CosmosClient(host, { masterKey });
                // create database
                const { result: db } = await client.createDatabase({ id: "sample 中文 database" });
                // create collection
                const { result: collection } =
                    await client.createCollection("dbs/sample 中文 database", { id: "sample collection" });
                // read documents
                const { result: documents } = await client.readDocuments(
                    TestHelpers.getCollectionLink(isNameBased, db, collection)).toArray();
                assert(Array.isArray(documents), "Value should be an array");
                // create a document
                const beforeCreateDocumentsCount = documents.length;
                const documentDefinition = {
                    name: "sample document",
                    foo: "bar",
                    key: "value",
                    replace: "new property",
                };
                try {
                    const { result: badUpdate } = await TestHelpers.createOrUpsertDocument(
                        TestHelpers.getCollectionLink(isNameBased, db, collection), documentDefinition,
                        { disableAutomaticIdGeneration: true }, client, isUpsertTest);
                    assert.fail("id generation disabled must throw with invalid id");
                } catch (err) {
                    assert(err !== undefined, "should throw an error because automatic id generation is disabled");
                }
                const { result: document } = await TestHelpers.createOrUpsertDocument(
                    TestHelpers.getCollectionLink(isNameBased, db, collection),
                    documentDefinition, undefined, client, isUpsertTest);
                assert.equal(document.name, documentDefinition.name);
                assert(document.id !== undefined);
                // read documents after creation
                const { result: documents2 } = await client.readDocuments(
                    TestHelpers.getCollectionLink(isNameBased, db, collection)).toArray();
                assert.equal(documents2.length, beforeCreateDocumentsCount + 1,
                    "create should increase the number of documents");
                // query documents
                const querySpec = {
                    query: "SELECT * FROM root r WHERE r.id=@id",
                    parameters: [
                        {
                            name: "@id",
                            value: document.id,
                        },
                    ],
                };
                const { result: results } = await client.queryDocuments(
                    TestHelpers.getCollectionLink(isNameBased, db, collection), querySpec).toArray();
                assert(results.length > 0, "number of results for the query should be > 0");
                const { result: results2 } = await client.queryDocuments(
                    TestHelpers.getCollectionLink(isNameBased, db, collection),
                    querySpec, { enableScanInQuery: true }).toArray();
                assert(results2.length > 0, "number of results for the query should be > 0");

                // replace document
                document.name = "replaced document";
                document.foo = "not bar";
                const { result: replacedDocument } = await TestHelpers.replaceOrUpsertDocument(
                    TestHelpers.getCollectionLink(isNameBased, db, collection),
                    TestHelpers.getDocumentLink(isNameBased, db, collection, document),
                    document, undefined, client, isUpsertTest);
                assert.equal(replacedDocument.name, "replaced document", "document name property should change");
                assert.equal(replacedDocument.foo, "not bar", "property should have changed");
                assert.equal(document.id, replacedDocument.id, "document id should stay the same");
                // read document
                const { result: document2 } = await client.readDocument(
                    TestHelpers.getDocumentLink(isNameBased, db, collection, replacedDocument));
                assert.equal(replacedDocument.id, document.id);
                // delete document
                const { result: res } = await client.deleteDocument(
                    TestHelpers.getDocumentLink(isNameBased, db, collection, replacedDocument));

                // read documents after deletion
                try {
                    const { result: document3 } = await client.readDocument(
                        TestHelpers.getDocumentLink(isNameBased, db, collection, document));
                    assert.fail("must throw if document doesn't exist");
                } catch (err) {
                    const notFoundErrorCode = 404;
                    assert.equal(err.code, notFoundErrorCode, "response should return error code 404");
                }
            } catch (err) {
                throw err;
            }
        };

        const documentCRUDMultiplePartitionsTest = async function (isNameBased: boolean) {
            try {
                const client = new CosmosClient(host, { masterKey });
                // create database
                const { result: db } = await client.createDatabase({ id: "db1" });

                const partitionKey = "key";

                // create collection
                const collectionDefinition = {
                    id: "coll1",
                    partitionKey: { paths: ["/" + partitionKey], kind: DocumentBase.PartitionKind.Hash },
                };

                const { result: collection } =
                    await client.createCollection(
                        TestHelpers.getDatabaseLink(isNameBased, db), collectionDefinition, { offerThroughput: 12000 });

                const documents = [
                    { id: "document1" },
                    { id: "document2", key: null, prop: 1 },
                    { id: "document3", key: false, prop: 1 },
                    { id: "document4", key: true, prop: 1 },
                    { id: "document5", key: 1, prop: 1 },
                    { id: "document6", key: "A", prop: 1 },
                ];

                let returnedDocuments =
                    await TestHelpers.bulkInsertDocuments(client, isNameBased, db, collection, documents);

                assert.equal(returnedDocuments.length, documents.length);
                returnedDocuments.sort(function (doc1, doc2) {
                    return doc1.id.localeCompare(doc2.id);
                });
                await TestHelpers.bulkReadDocuments(
                    client, isNameBased, db, collection, returnedDocuments, partitionKey);
                const { result: successDocuments } = await client.readDocuments(
                    TestHelpers.getCollectionLink(isNameBased, db, collection)).toArray();
                assert(successDocuments !== undefined, "error reading documents");
                assert.equal(successDocuments.length, returnedDocuments.length,
                    "Expected " + returnedDocuments.length + " documents to be succesfully read");
                successDocuments.sort(function (doc1, doc2) {
                    return doc1.id.localeCompare(doc2.id);
                });
                assert.equal(JSON.stringify(successDocuments), JSON.stringify(returnedDocuments),
                    "Unexpected documents are returned");

                returnedDocuments.forEach(function (document) { ++document.prop; });
                const newReturnedDocuments =
                    await TestHelpers.bulkReplaceDocuments(client, isNameBased, db,
                        collection, returnedDocuments, partitionKey);
                returnedDocuments = newReturnedDocuments;
                await TestHelpers.bulkQueryDocumentsWithPartitionKey(client, isNameBased, db,
                    collection, returnedDocuments, partitionKey);
                const querySpec = {
                    query: "SELECT * FROM Root",
                };
                try {
                    const { result: badUpdate } = await client.queryDocuments(
                        TestHelpers.getCollectionLink(isNameBased, db, collection),
                        querySpec, { enableScanInQuery: true }).toArray();
                    assert.fail("Must fail");
                } catch (err) {
                    const badRequestErrorCode = 400;
                    assert.equal(err.code, badRequestErrorCode,
                        "response should return error code " + badRequestErrorCode);
                }
                const { result: results } = await client.queryDocuments(
                    TestHelpers.getCollectionLink(isNameBased, db, collection), querySpec,
                    { enableScanInQuery: true, enableCrossPartitionQuery: true }).toArray();
                assert(results !== undefined, "error querying documents");
                results.sort(function (doc1, doc2) {
                    return doc1.id.localeCompare(doc2.id);
                });
                assert.equal(results.length, returnedDocuments.length,
                    "Expected " + returnedDocuments.length + " documents to be succesfully queried");
                assert.equal(JSON.stringify(results), JSON.stringify(returnedDocuments), "Unexpected query results");

                await TestHelpers.bulkDeleteDocuments(
                    client, isNameBased, db, collection, returnedDocuments, partitionKey);
            } catch (err) {
                throw err;
            }
        };

        it("nativeApi Should do document CRUD operations successfully name based", async function () {
            try {
                await documentCRUDTest(true, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do document CRUD operations successfully rid based", async function () {
            try {
                await documentCRUDTest(false, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do document CRUD operations successfully name based with upsert", async function () {
            try {
                await documentCRUDTest(true, true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do document CRUD operations successfully rid based with upsert", async function () {
            try {
                await documentCRUDTest(false, true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do document CRUD operations over multiple partitions successfully name based",
            async function () {
                try {
                    await documentCRUDMultiplePartitionsTest(true);
                } catch (err) {
                    throw err;
                }
            });

        it("nativeApi Should do document CRUD operations over multiple partitions successfully rid based",
            async function () {
                try {
                    await documentCRUDMultiplePartitionsTest(false);
                } catch (err) {
                    throw err;
                }
            });
    });

    describe("Validate Attachment CRUD", function () {

        beforeEach(async function () {
            try {
                await TestHelpers.removeAllDatabases(host, masterKey);
            } catch (err) {
                throw err;
            }
        });

        const createReadableStream = function (firstChunk?: any, secondChunk?: any) { // TODO: any
            const readableStream = new Stream.Readable();
            let chunkCount = 0;
            readableStream._read = function (n) {
                if (chunkCount === 0) {
                    this.push(firstChunk || "first chunk ");
                } else if (chunkCount === 1) {
                    this.push(secondChunk || "second chunk");
                } else {
                    this.push(null);
                }
                chunkCount++;
            };

            return readableStream;
        };

        const readMediaResponse = function (response: any): Promise<any> { // TODO: any
            return new Promise((resolve, reject) => {
                let data = "";
                response.on("data", function (chunk: any) {
                    data += chunk;
                });
                response.on("end", function () {
                    if (response.statusCode >= 300) {
                        return reject({ code: response.statusCode, body: data });
                    }

                    return resolve(data);
                });
            });
        };

        const attachmentCRUDTest = async function (isNameBased: boolean, isUpsertTest: boolean) {
            try {
                const client = new CosmosClient(host, { masterKey });

                // create database
                const { result: db } = await client.createDatabase({ id: "sample database" });
                // create collection
                const { result: collection } = await client.createCollection(
                    TestHelpers.getDatabaseLink(isNameBased, db), { id: "sample collection" });
                // create document
                const { result: document } = await client.createDocument(
                    TestHelpers.getCollectionLink(isNameBased, db, collection),
                    { id: "sample document", foo: "bar", key: "value" });

                // list all attachments
                const { result: attachments } = await client.readAttachments(
                    TestHelpers.getDocumentLink(isNameBased, db, collection, document)).toArray();
                assert(Array.isArray(attachments), "Value should be an array");

                const initialCount = attachments.length;
                const validMediaOptions = { slug: "attachment name", contentType: "application/text" };
                const invalidMediaOptions = { slug: "attachment name", contentType: "junt/test" };
                let contentStream = createReadableStream();

                // create attachment with invalid content-type
                try {
                    const { result: badCreate } = await TestHelpers.createOrUpsertAttachmentAndUploadMedia(
                        TestHelpers.getDocumentLink(isNameBased, db, collection, document), contentStream, invalidMediaOptions, client, isUpsertTest);
                    assert.fail("Must fail to create attachment");
                } catch (err) {
                    assert(err !== undefined, "create attachment should return error on invalid mediatypes");
                    const badRequestErrorCode = 400;
                    assert.equal(err.code, badRequestErrorCode);
                }
                contentStream = createReadableStream();

                // create streamed attachment with valid content-type
                const { result: validAttachment } = await TestHelpers.createOrUpsertAttachmentAndUploadMedia(
                    TestHelpers.getDocumentLink(isNameBased, db, collection, document), contentStream, validMediaOptions, client, isUpsertTest);
                assert.equal(validAttachment.id, "attachment name",
                    "name of created attachment should be the same as the one in the request");
                contentStream = createReadableStream();

                // create colliding attachment
                try {
                    const content2 = "bug";
                    const { result: attachment } = await client.createAttachmentAndUploadMedia(
                        TestHelpers.getDocumentLink(isNameBased, db, collection, document), contentStream, validMediaOptions);
                    assert.fail("Must fail to create colliding attachment");
                } catch (err) {
                    assert(err !== undefined, "create conflicting attachment should return error on conflicting names");
                    const conflictErrorCode = 409;
                    assert.equal(err.code, conflictErrorCode);
                }
                contentStream = createReadableStream();

                // create attachment with media link
                const dynamicAttachment = {
                    id: "dynamic attachment",
                    media: "http:// xstore.",
                    MediaType: "Book",
                    Author: "My Book Author",
                    Title: "My Book Title",
                    contentType: "application/text",
                };
                const { result: attachmentWithMediaLink } = await TestHelpers.createOrUpsertAttachment(
                    TestHelpers.getDocumentLink(isNameBased, db, collection, document), dynamicAttachment, undefined, client, isUpsertTest);
                assert.equal(attachmentWithMediaLink.MediaType, "Book", "invalid media type");
                assert.equal(attachmentWithMediaLink.Author, "My Book Author", "invalid property value");

                // list all attachments
                const { result: attachments2 } = await client.readAttachments(
                    TestHelpers.getDocumentLink(isNameBased, db, collection, document)).toArray();
                assert.equal(attachments2.length, initialCount + 2, "number of attachments should've increased by 2");
                attachmentWithMediaLink.Author = "new author";

                // replace the attachment
                const { result: replacedAttachment } = await TestHelpers.replaceOrUpsertAttachment(
                    TestHelpers.getDocumentLink(isNameBased, db, collection, document),
                    TestHelpers.getAttachmentLink(isNameBased, db, collection, document, attachmentWithMediaLink),
                    attachmentWithMediaLink, undefined, client, isUpsertTest);
                assert.equal(replacedAttachment.MediaType, "Book", "invalid media type");
                assert.equal(replacedAttachment.Author, "new author", "invalid property value");

                // read attachment media
                const { result: mediaResponse } = await client.readMedia(validAttachment.media);
                assert.equal(mediaResponse, "first chunk second chunk");
                contentStream = createReadableStream("modified first chunk ", "modified second chunk");

                // update attachment media
                const { result: updatedMediaResult } = await TestHelpers.updateOrUpsertMedia(
                    TestHelpers.getDocumentLink(isNameBased, db, collection, document),
                    validAttachment.media, contentStream, validMediaOptions, client, isUpsertTest);

                // read attachment media after update
                // read media buffered
                const { result: mediaResponse2 } = await client.readMedia(validAttachment.media);
                assert.equal(mediaResponse2, "modified first chunk modified second chunk");

                // read media streamed
                client.connectionPolicy.MediaReadMode = DocumentBase.MediaReadMode.Streamed;
                const { result: mediaResponseStreamed } = await client.readMedia(validAttachment.media);
                const mediaResult = await readMediaResponse(mediaResponseStreamed);
                assert.equal(mediaResult, "modified first chunk modified second chunk");

                // share attachment with a second document
                const { result: document2 } = await client.createDocument(
                    TestHelpers.getCollectionLink(isNameBased, db, collection), { id: "document 2" });
                const secondAttachment = { id: validAttachment.id, contentType: validAttachment.contentType, media: validAttachment.media };
                const { result: attachment2 } = await TestHelpers.createOrUpsertAttachment(
                    TestHelpers.getDocumentLink(isNameBased, db, collection, document2),
                    secondAttachment, undefined, client, isUpsertTest);
                assert.equal(validAttachment.id, attachment2.id, "name mismatch");
                assert.equal(validAttachment.media, attachment2.media, "media mismatch");
                assert.equal(validAttachment.contentType, attachment2.contentType, "contentType mismatch");

                // deleting attachment
                const { result: deletedAttachment } = await client.deleteAttachment(
                    TestHelpers.getAttachmentLink(isNameBased, db, collection, document, validAttachment));

                // read attachments after deletion
                try {
                    const { result: attachment } = await client.readAttachment(
                        TestHelpers.getAttachmentLink(isNameBased, db, collection, document, validAttachment));
                    assert.fail("Must fail to read attachment after deletion");
                } catch (err) {
                    const notFoundErrorCode = 404;
                    assert.equal(err.code, notFoundErrorCode, "response should return error code 404");
                }
            } catch (err) {
                throw err;
            }
        };

        const attachmentCRUDOverMultiplePartitionsTest = async function (isNameBased: boolean, isUpsertTest: boolean) {
            try {
                const client = new CosmosClient(host, { masterKey });

                // create database
                const { result: db } = await client.createDatabase({ id: "sample database" });
                // create collection
                const partitionKey = "id";
                const collectionDefinition = {
                    id: "coll1",
                    partitionKey: { paths: ["/" + partitionKey], kind: DocumentBase.PartitionKind.Hash },
                };
                const { result: collection } = await client.createCollection(
                    TestHelpers.getDatabaseLink(isNameBased, db), collectionDefinition, { offerThroughput: 12000 });
                // create document
                const { result: document } = await client.createDocument(
                    TestHelpers.getCollectionLink(isNameBased, db, collection), { id: "sample document", foo: "bar", key: "value" });
                const sampleDocumentPartitionKeyValue = document[partitionKey];
                // list all attachments
                const { result: attachments } = await client.readAttachments(
                    TestHelpers.getDocumentLink(isNameBased, db, collection, document), { partitionKey: sampleDocumentPartitionKeyValue }).toArray();
                assert(Array.isArray(attachments), "Value should be an array");
                const initialCount = attachments.length;
                const validMediaOptions = { slug: "attachment name", contentType: "application/text", partitionKey: document[partitionKey] };
                const invalidMediaOptions = { slug: "attachment name", contentType: "junt/test", partitionKey: document[partitionKey] };

                // create attachment with invalid content-type
                let contentStream = createReadableStream();
                try {
                    const { result: badUpdate } = await TestHelpers.createOrUpsertAttachmentAndUploadMedia(
                        TestHelpers.getDocumentLink(isNameBased, db, collection, document),
                        contentStream, invalidMediaOptions, client, isUpsertTest);
                    assert.fail("Must fail to insert attachment with invalid content-type");
                } catch (err) {
                    assert(err !== undefined, "create attachment should return error on invalid mediatypes");
                    const badRequestErrorCode = 400;
                    assert.equal(err.code, badRequestErrorCode);
                }
                contentStream = createReadableStream();

                // create streamed attachment with valid content-type
                const { result: validAttachment } = await TestHelpers.createOrUpsertAttachmentAndUploadMedia(
                    TestHelpers.getDocumentLink(isNameBased, db, collection, document),
                    contentStream, validMediaOptions, client, isUpsertTest);
                assert.equal(validAttachment.id, "attachment name", "name of created attachment should be the same as the one in the request");
                contentStream = createReadableStream();

                // create colliding attachment
                try {
                    const content2 = "bug";
                    const { result: badCreate } = await client.createAttachmentAndUploadMedia(
                        TestHelpers.getDocumentLink(isNameBased, db, collection, document), contentStream, validMediaOptions);
                    assert.fail("create conflicting attachment should return error on conflicting names");
                } catch (err) {
                    const conflictErrorCode = 409;
                    assert.equal(err.code, conflictErrorCode);
                    contentStream = createReadableStream();
                }

                // create attachment with media link
                const dynamicAttachment = {
                    id: "dynamic attachment",
                    media: "http://xstore.",
                    MediaType: "Book",
                    Author: "My Book Author",
                    Title: "My Book Title",
                    contentType: "application/text",
                };
                const { result: attachmentWithMediaLink } = await TestHelpers.createOrUpsertAttachment(
                    TestHelpers.getDocumentLink(isNameBased, db, collection, document),
                    dynamicAttachment, { partitionKey: sampleDocumentPartitionKeyValue }, client, isUpsertTest);
                assert.equal(attachmentWithMediaLink.MediaType, "Book", "invalid media type");
                assert.equal(attachmentWithMediaLink.Author, "My Book Author", "invalid property value");

                // list all attachments
                const { result: attachments2 } = await client.readAttachments(
                    TestHelpers.getDocumentLink(isNameBased, db, collection, document), { partitionKey: document[partitionKey] }).toArray();
                assert.equal(attachments2.length, initialCount + 2, "number of attachments should've increased by 2");
                attachmentWithMediaLink.Author = "new author";

                // replace the attachment
                const { result: replacedAttachment } = await TestHelpers.replaceOrUpsertAttachment(
                    TestHelpers.getDocumentLink(isNameBased, db, collection, document),
                    TestHelpers.getAttachmentLink(isNameBased, db, collection, document, attachmentWithMediaLink),
                    attachmentWithMediaLink, { partitionKey: sampleDocumentPartitionKeyValue }, client, isUpsertTest);
                assert.equal(replacedAttachment.MediaType, "Book", "invalid media type");
                assert.equal(replacedAttachment.Author, "new author", "invalid property value");

                // read attachment media
                const { result: mediaResponse } = await client.readMedia(validAttachment.media);
                assert.equal(mediaResponse, "first chunk second chunk");
                contentStream = createReadableStream("modified first chunk ", "modified second chunk");

                // update attachment media
                const { result: mediaResult } = await TestHelpers.updateOrUpsertMedia(
                    TestHelpers.getDocumentLink(isNameBased, db, collection, document),
                    validAttachment.media, contentStream, validMediaOptions, client, isUpsertTest);

                // read attachment media after update
                // read media buffered
                const { result: mediaResponseAfterUpdate } = await client.readMedia(validAttachment.media);
                assert.equal(mediaResponseAfterUpdate, "modified first chunk modified second chunk");

                // read media streamed
                client.connectionPolicy.MediaReadMode = DocumentBase.MediaReadMode.Streamed;
                const { result: mediaResponseStreamed } = await client.readMedia(validAttachment.media);
                const mediaResultStreamed = await readMediaResponse(mediaResponseStreamed);
                assert.equal(mediaResultStreamed, "modified first chunk modified second chunk");

                // share attachment with a second document
                const { result: document2 } = await client.createDocument(
                    TestHelpers.getCollectionLink(isNameBased, db, collection), { id: "document 2" });
                const secondDocumentPartitionKeyValue = document2[partitionKey];
                const secondAttachment = { id: validAttachment.id, contentType: validAttachment.contentType, media: validAttachment.media };
                const { result: attachment2 } = await TestHelpers.createOrUpsertAttachment(
                    TestHelpers.getDocumentLink(isNameBased, db, collection, document2),
                    secondAttachment, { partitionKey: secondDocumentPartitionKeyValue }, client, isUpsertTest);
                assert.equal(validAttachment.id, attachment2.id, "name mismatch");
                assert.equal(validAttachment.media, attachment2.media, "media mismatch");
                assert.equal(validAttachment.contentType, attachment2.contentType, "contentType mismatch");
                const createdAttachment = attachment2;

                // deleting attachment
                const { result: attachment } = await client.deleteAttachment(
                    TestHelpers.getAttachmentLink(isNameBased, db, collection, document2, createdAttachment), { partitionKey: secondDocumentPartitionKeyValue });

                // read attachments after deletion
                try {
                    const { result: badRead } = await client.readAttachment(
                        TestHelpers.getAttachmentLink(isNameBased, db, collection, document2, createdAttachment), { partitionKey: secondDocumentPartitionKeyValue });
                    assert.fail("Must fail to read after deletion");
                } catch (err) {
                    const notFoundErrorCode = 404;
                    assert.equal(err.code, notFoundErrorCode, "response should return error code 404");
                }
            } catch (err) {
                throw err;
            }

        };

        it("nativeApi Should do attachment CRUD operations successfully name based", async function () {
            try {
                await attachmentCRUDTest(true, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do attachment CRUD operations successfully rid based", async function () {
            try {
                await attachmentCRUDTest(false, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do attachment CRUD operations successfully name based with upsert", async function () {
            try {
                await attachmentCRUDTest(true, true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do attachment CRUD operations successfully rid based with upsert", async function () {
            try {
                await attachmentCRUDTest(false, true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do attachment CRUD operations over multiple partitions successfully name based", async function () {
            try {
                await attachmentCRUDOverMultiplePartitionsTest(true, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do attachment CRUD operations over multiple partitions successfully rid based", async function () {
            try {
                await attachmentCRUDOverMultiplePartitionsTest(false, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do attachment CRUD operations over multiple partitions successfully name based with upsert", async function () {
            try {
                await attachmentCRUDOverMultiplePartitionsTest(true, true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do attachment CRUD operations over multiple partitions successfully rid based with upsert", async function () {
            try {
                await attachmentCRUDOverMultiplePartitionsTest(false, true);
            } catch (err) {
                throw err;
            }
        });
    });

    describe("Validate User CRUD", function () {
        const userCRUDTest = async function (isNameBased: boolean, isUpsertTest: boolean) {
            try {
                const client = new CosmosClient(host, { masterKey });

                // create database
                const { result: db } = await client.createDatabase({ id: "sample database" });

                // list users
                const { result: users } = await client.readUsers(
                    TestHelpers.getDatabaseLink(isNameBased, db)).toArray();
                assert.equal(users.constructor, Array, "Value should be an array");
                const beforeCreateCount = users.length;

                // create user
                const { result: user } = await TestHelpers.createOrUpsertUser(
                    TestHelpers.getDatabaseLink(isNameBased, db), { id: "new user" },
                    undefined, client, isUpsertTest);
                assert.equal(user.id, "new user", "user name error");

                // list users after creation
                const { result: usersAfterCreation } = await client.readUsers(
                    TestHelpers.getDatabaseLink(isNameBased, db)).toArray();
                assert.equal(usersAfterCreation.length, beforeCreateCount + 1);

                // query users
                const querySpec = {
                    query: "SELECT * FROM root r WHERE r.id=@id",
                    parameters: [
                        {
                            name: "@id",
                            value: "new user",
                        },
                    ],
                };
                const { result: results } = await client.queryUsers(
                    TestHelpers.getDatabaseLink(isNameBased, db), querySpec).toArray();
                assert(results.length > 0, "number of results for the query should be > 0");

                // replace user
                user.id = "replaced user";
                const { result: replacedUser } = await TestHelpers.replaceOrUpsertUser(
                    TestHelpers.getDatabaseLink(isNameBased, db), user._self, user, undefined, client, isUpsertTest);
                assert.equal(replacedUser.id, "replaced user", "user name should change");
                assert.equal(user.id, replacedUser.id, "user id should stay the same");

                // read user
                const { result: userAfterReplace } = await client.readUser(
                    TestHelpers.getUserLink(isNameBased, db, replacedUser));
                assert.equal(replacedUser.id, userAfterReplace.id);

                // delete user
                const { result: res } = await client.deleteUser(
                    TestHelpers.getUserLink(isNameBased, db, user));

                // read user after deletion
                try {
                    const { result: badUser } = await client.readUser(
                        TestHelpers.getUserLink(isNameBased, db, user));
                    assert.fail("Must fail to read user after deletion");
                } catch (err) {
                    const notFoundErrorCode = 404;
                    assert.equal(err.code, notFoundErrorCode, "response should return error code 404");
                }
            } catch (err) {
                throw err;
            }
        };

        it("nativeApi Should do User CRUD operations successfully name based", async function () {
            try {
                await userCRUDTest(true, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do User CRUD operations successfully rid based", async function () {
            try {
                await userCRUDTest(false, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do User CRUD operations successfully name based with upsert", async function () {
            try {
                await userCRUDTest(true, true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do User CRUD operations successfully rid based with upsert", async function () {
            try {
                await userCRUDTest(false, true);
            } catch (err) {
                throw err;
            }
        });
    });

    describe("Validate Permission CRUD", function () {
        const permissionCRUDTest = async function (isNameBased: boolean, isUpsertTest: boolean) {
            try {
                const client = new CosmosClient(host, { masterKey });

                // create database
                const { result: db } = await client.createDatabase({ id: "sample database" });
                const { result: coll } = await client.createCollection(
                    TestHelpers.getDatabaseLink(isNameBased, db), { id: "sample coll" });

                // create user
                const { result: user } = await client.createUser(
                    TestHelpers.getDatabaseLink(isNameBased, db), { id: "new user" });

                // list permissions
                const { result: permissions } = await client.readPermissions(
                    TestHelpers.getUserLink(isNameBased, db, user)).toArray();
                assert.equal(permissions.constructor, Array, "Value should be an array");
                const beforeCreateCount = permissions.length;
                const permission = { id: "new permission", permissionMode: DocumentBase.PermissionMode.Read, resource: coll._self };

                // create permission
                const { result: createdPermission } = await TestHelpers.createOrUpsertPermission(
                    TestHelpers.getUserLink(isNameBased, db, user), permission, undefined, client, isUpsertTest);
                assert.equal(createdPermission.id, "new permission", "permission name error");

                // list permissions after creation
                const { result: permissionsAfterCreation } = await client.readPermissions(
                    TestHelpers.getUserLink(isNameBased, db, user)).toArray();
                assert.equal(permissionsAfterCreation.length, beforeCreateCount + 1);

                // query permissions
                const querySpec = {
                    query: "SELECT * FROM root r WHERE r.id=@id",
                    parameters: [
                        {
                            name: "@id",
                            value: permission.id,
                        },
                    ],
                };
                const { result: results } = await client.queryPermissions(
                    TestHelpers.getUserLink(isNameBased, db, user), querySpec).toArray();
                assert(results.length > 0, "number of results for the query should be > 0");
                permission.permissionMode = DocumentBase.PermissionMode.All;
                const { result: replacedPermission } = await TestHelpers.replaceOrUpsertPermission(
                    TestHelpers.getUserLink(isNameBased, db, user), createdPermission._self, permission, undefined, client, isUpsertTest);
                assert.equal(replacedPermission.permissionMode, DocumentBase.PermissionMode.All, "permission mode should change");
                assert.equal(permission.id, replacedPermission.id, "permission id should stay the same");

                // to change the id of an existing resourcewe have to use replace
                permission.id = "replaced permission";
                const { result: replacedPermission2 } = await client.replacePermission(createdPermission._self, permission);
                assert.equal(replacedPermission2.id, "replaced permission", "permission name should change");
                assert.equal(permission.id, replacedPermission2.id, "permission id should stay the same");

                // read permission
                const { result: permissionAfterReplace } = await client.readPermission(
                    TestHelpers.getPermissionLink(isNameBased, db, user, replacedPermission2));
                assert.equal(permissionAfterReplace.id, permission.id);

                // delete permission
                const { result: res } = await client.deletePermission(
                    TestHelpers.getPermissionLink(isNameBased, db, user, replacedPermission2));

                // read permission after deletion
                try {
                    const { result: badPermission } = await client.readPermission(
                        TestHelpers.getPermissionLink(isNameBased, db, user, replacedPermission2));
                    assert.fail("Must fail to read permission after deletion");
                } catch (err) {
                    const notFoundErrorCode = 404;
                    assert.equal(err.code, notFoundErrorCode, "response should return error code 404");
                }
            } catch (err) {
                throw err;
            }
        };

        const permissionCRUDOverMultiplePartitionsTest = async function (isNameBased: boolean, isUpsertTest: boolean) {
            const client = new CosmosClient(host, { masterKey });

            // create database
            const { result: db } = await client.createDatabase({ id: "sample database" });
            // create collection
            const partitionKey = "id";
            const collectionDefinition = {
                id: "coll1",
                partitionKey: { paths: ["/" + partitionKey], kind: DocumentBase.PartitionKind.Hash },
            };
            const { result: coll } = await client.createCollection(
                TestHelpers.getDatabaseLink(isNameBased, db), collectionDefinition, { offerThroughput: 12000 });

            // create user
            const { result: user } = await client.createUser(
                TestHelpers.getDatabaseLink(isNameBased, db), { id: "new user" });

            // list permissions
            const { result: permissions } = await client.readPermissions(
                TestHelpers.getUserLink(isNameBased, db, user)).toArray();
            assert(Array.isArray(permissions), "Value should be an array");
            const beforeCreateCount = permissions.length;
            const permissionDefinition = { id: "new permission", permissionMode: DocumentBase.PermissionMode.Read, resource: coll._self, resourcePartitionKey: [1] };

            // create permission
            const { result: permission } = await TestHelpers.createOrUpsertPermission(
                TestHelpers.getUserLink(isNameBased, db, user), permissionDefinition, undefined, client, isUpsertTest);
            assert.equal(permission.id, permissionDefinition.id, "permission name error");
            assert.equal(JSON.stringify(permission.resourcePartitionKey), JSON.stringify(permissionDefinition.resourcePartitionKey), "permission resource partition key error");

            // list permissions after creation
            const { result: permissionsAfterCreation } = await client.readPermissions(
                TestHelpers.getUserLink(isNameBased, db, user)).toArray();
            assert.equal(permissionsAfterCreation.length, beforeCreateCount + 1);

            // query permissions
            const querySpec = {
                query: "SELECT * FROM root r WHERE r.id=@id",
                parameters: [
                    {
                        name: "@id",
                        value: permission.id,
                    },
                ],
            };
            const { result: results } = await client.queryPermissions(
                TestHelpers.getUserLink(isNameBased, db, user), querySpec).toArray();
            assert(results.length > 0, "number of results for the query should be > 0");
            permission.permissionMode = DocumentBase.PermissionMode.All;
            const { result: replacedPermission } = await TestHelpers.replaceOrUpsertPermission(
                TestHelpers.getUserLink(isNameBased, db, user), permission._self, permission, undefined, client, isUpsertTest);
            assert.equal(replacedPermission.permissionMode, DocumentBase.PermissionMode.All, "permission mode should change");
            assert.equal(replacedPermission.id, permission.id, "permission id should stay the same");
            assert.equal(JSON.stringify(replacedPermission.resourcePartitionKey), JSON.stringify(permission.resourcePartitionKey), "permission resource partition key error");

            // to change the id of an existing resourcewe have to use replace
            permission.id = "replaced permission";
            const { result: replacedPermission2 } = await client.replacePermission(permission._self, permission);
            assert.equal(replacedPermission2.id, permission.id);

            // read permission
            const { result: permissionAfterReplace } = await client.readPermission(
                TestHelpers.getPermissionLink(isNameBased, db, user, replacedPermission2));
            assert.equal(permissionAfterReplace.id, replacedPermission2.id);

            // delete permission
            const { result: res } = await client.deletePermission(
                TestHelpers.getPermissionLink(isNameBased, db, user, permissionAfterReplace));

            // read permission after deletion
            try {
                const { result: badPermission } = await client.readPermission(
                    TestHelpers.getPermissionLink(isNameBased, db, user, permissionAfterReplace));
                assert.fail("Must throw on read after delete");
            } catch (err) {
                const notFoundErrorCode = 404;
                assert.equal(err.code, notFoundErrorCode, "response should return error code 404");
            }

        };

        it("nativeApi Should do Permission CRUD operations successfully name based", async function () {
            try {
                await permissionCRUDTest(true, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do Permission CRUD operations successfully rid based", async function () {
            try {
                await permissionCRUDTest(false, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do Permission CRUD operations successfully name based with upsert", async function () {
            try {
                await permissionCRUDTest(true, true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do Permission CRUD operations successfully rid based with upsert", async function () {
            try {
                await permissionCRUDTest(false, true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do Permission CRUD operations over multiple partitions successfully name based", async function () {
            try {
                await permissionCRUDOverMultiplePartitionsTest(true, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do Permission CRUD operations over multiple partitions successfully rid based", async function () {
            try {
                await permissionCRUDOverMultiplePartitionsTest(false, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do Permission CRUD operations over multiple partitions successfully name based with upsert", async function () {
            try {
                await permissionCRUDOverMultiplePartitionsTest(true, true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do Permission CRUD operations over multiple partitions successfully rid based with upsert", async function () {
            try {
                await permissionCRUDOverMultiplePartitionsTest(false, true);
            } catch (err) {
                throw err;
            }
        });
    });

    describe("Validate Authorization", function () {
        const setupEntities = async function (isNameBased: boolean, isUpsertTest: boolean, client: CosmosClient) {
            // create database
            const { result: db } = await client.createDatabase({ id: "sample database" });
            // create collection1
            const { result: collection1 } = await client.createCollection(
                TestHelpers.getDatabaseLink(isNameBased, db), { id: "sample collection" });
            // create document1
            const { result: document1 } = await client.createDocument(
                TestHelpers.getCollectionLink(isNameBased, db, collection1), { id: "coll1doc1", foo: "bar", key: "value" });
            // create document 2
            const { result: document2 } = await client.createDocument(
                TestHelpers.getCollectionLink(isNameBased, db, collection1), { id: "coll1doc2", foo: "bar2", key: "value2" });
            // create attachment
            const dynamicAttachment = {
                id: "dynamic attachment",
                media: "http://xstore.",
                MediaType: "Book",
                Author: "My Book Author",
                Title: "My Book Title",
                contentType: "application/text",
            };
            const { result: attachment } = await client.createAttachment(
                TestHelpers.getDocumentLink(isNameBased, db, collection1, document1), dynamicAttachment);
            // create collection 2
            const { result: collection2 } = await client.createCollection(
                TestHelpers.getDatabaseLink(isNameBased, db), { id: "sample collection2" });
            // create user1
            const { result: user1 } = await client.createUser(
                TestHelpers.getDatabaseLink(isNameBased, db), { id: "user1" });
            let permission = { id: "permission On Coll1", permissionMode: DocumentBase.PermissionMode.Read, resource: collection1._self };
            // create permission for collection1
            const { result: permissionOnColl1 } = await TestHelpers.createOrUpsertPermission(
                TestHelpers.getUserLink(isNameBased, db, user1), permission, undefined, client, isUpsertTest);
            assert(permissionOnColl1._token !== undefined, "permission token is invalid");
            permission = { id: "permission On Doc1", permissionMode: DocumentBase.PermissionMode.All, resource: document2._self };
            // create permission for document 2
            const { result: permissionOnDoc2 } = await TestHelpers.createOrUpsertPermission(
                TestHelpers.getUserLink(isNameBased, db, user1), permission, undefined, client, isUpsertTest);
            assert(permissionOnDoc2._token !== undefined, "permission token is invalid");
            // create user 2
            const { result: user2 } = await client.createUser(
                TestHelpers.getDatabaseLink(isNameBased, db), { id: "user2" });
            permission = { id: "permission On coll2", permissionMode: DocumentBase.PermissionMode.All, resource: collection2._self };
            // create permission on collection 2
            const { result: permissionOnColl2 } = await TestHelpers.createOrUpsertPermission(
                TestHelpers.getUserLink(isNameBased, db, user2), permission, undefined, client, isUpsertTest);
            const entities = {
                db,
                coll1: collection1,
                coll2: collection2,
                doc1: document1,
                doc2: document2,
                user1,
                user2,
                attachment,
                permissionOnColl1,
                permissionOnDoc2,
                permissionOnColl2,
            };

            return entities;
        };

        const authorizationCRUDTest = async function (isNameBased: boolean, isUpsertTest: boolean) {
            try {
                const badclient = new CosmosClient(host, undefined);
                const { result: databases } = await badclient.readDatabases().toArray();
                assert.fail("Must fail");
            } catch (err) {
                assert(err !== undefined, "error should not be undefined");
                const unauthorizedErrorCode = 401;
                assert.equal(err.code, unauthorizedErrorCode, "error code should be equal to 401");
            }

            const client = new CosmosClient(host, { masterKey });

            // setup entities
            const entities = await setupEntities(isNameBased, isUpsertTest, client);
            const resourceTokens: any = {};
            if (isNameBased) {
                resourceTokens[entities.coll1.id] = entities.permissionOnColl1._token;
                resourceTokens[entities.doc1.id] = entities.permissionOnColl1._token;
            } else {
                resourceTokens[entities.coll1._rid] = entities.permissionOnColl1._token;
                resourceTokens[entities.doc1._rid] = entities.permissionOnColl1._token;
            }

            const col1Client = new CosmosClient(host, { resourceTokens });
            const coll1Link = TestHelpers.getCollectionLink(isNameBased, entities.db, entities.coll1);

            // 1. Success-- Use Col1 Permission to Read
            const { result: successColl1 } = await col1Client.readCollection(coll1Link);
            assert(successColl1 !== undefined, "error reading collection");

            // 2. Failure-- Use Col1 Permission to delete
            try {
                const { result: result } = await col1Client.deleteCollection(coll1Link);
                assert.fail("must fail if no permission");
            } catch (err) {
                assert(err !== undefined, "expected to fail, no permission to delete");
                assert.equal(err.code, 403, "Must return a code for not authorized");
            }

            // 3. Success-- Use Col1 Permission to Read All Docs
            const { result: successDocuments } = await col1Client.readDocuments(coll1Link).toArray();
            assert(successDocuments !== undefined, "error reading documents");
            assert.equal(successDocuments.length, 2, "Expected 2 Documents to be succesfully read");

            // 4. Success-- Use Col1 Permission to Read Col1Doc1
            const doc1Link = TestHelpers.getDocumentLink(isNameBased, entities.db, entities.coll1, entities.doc1);
            const { result: successDoc } = await col1Client.readDocument(doc1Link);
            assert(successDoc !== undefined, "error reading document");
            assert.equal(successDoc.id, entities.doc1.id, "Expected to read children using parent permissions");

            const col2Client = new CosmosClient(host, { permissionFeed: [entities.permissionOnColl2] });
            const doc = { id: "new doc", CustomProperty1: "BBBBBB", customProperty2: 1000 };
            const { result: successDoc2 } = await TestHelpers.createOrUpsertDocument(entities.coll2._self, doc, undefined, col2Client, isUpsertTest);
            assert(successDoc2 !== undefined, "error creating document");
            assert.equal(successDoc2.CustomProperty1, doc.CustomProperty1, "document should have been created successfully");
        };

        const authorizationCRUDOverMultiplePartitionsTest = async function (isNameBased: boolean) {
            const client = new CosmosClient(host, { masterKey });
            // create database
            const { result: db } = await client.createDatabase({ id: "sample database" });
            // create collection
            const partitionKey = "key";
            const collectionDefinition = {
                id: "coll1",
                partitionKey: { paths: ["/" + partitionKey], kind: DocumentBase.PartitionKind.Hash },
            };
            const { result: coll } = await client.createCollection(
                TestHelpers.getDatabaseLink(isNameBased, db), collectionDefinition, { offerThroughput: 12000 });
            // create user
            const { result: user } = await client.createUser(
                TestHelpers.getDatabaseLink(isNameBased, db), { id: "user1" });

            const key = 1;
            const permissionDefinition = {
                id: "permission1",
                permissionMode: DocumentBase.PermissionMode.All,
                resource: TestHelpers.getCollectionLink(isNameBased, db, coll),
                resourcePartitionKey: [key],
            };
            // create permission
            const { result: permission } = await client.createPermission(
                TestHelpers.getUserLink(isNameBased, db, user), permissionDefinition);
            assert(permission._token !== undefined, "permission token is invalid");
            const resourceTokens: any = {};
            if (isNameBased) {
                resourceTokens[coll.id] = permission._token;
            } else {
                resourceTokens[coll._rid] = permission._token;
            }

            const restrictedClient = new CosmosClient(host, { resourceTokens });

            const { result: document } = await restrictedClient.createDocument(
                TestHelpers.getCollectionLink(isNameBased, db, coll), { id: "document1", key: 1 });
            try {
                const { result: baddocument } = await restrictedClient.createDocument(
                    TestHelpers.getCollectionLink(isNameBased, db, coll), { id: "document2", key: 2 });
                assert.fail("Must throw unauthorized on read");
            } catch (err) {
                const unauthorizedErrorCode = 403;
                assert.equal(err.code, unauthorizedErrorCode);
            }
        };

        it("nativeApi Should do authorization successfully name based", async function () {
            try {
                await authorizationCRUDTest(true, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do authorization successfully rid based", async function () {
            try {
                await authorizationCRUDTest(false, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do authorization successfully name based with upsert", async function () {
            try {
                await authorizationCRUDTest(true, true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do authorization successfully rid based with upsert", async function () {
            try {
                await authorizationCRUDTest(false, true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do authorization over multiple partitions successfully name based", async function () {
            try {
                await authorizationCRUDOverMultiplePartitionsTest(true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do authorization over multiple partitions successfully rid based", async function () {
            try {
                await authorizationCRUDOverMultiplePartitionsTest(false);
            } catch (err) {
                throw err;
            }
        });
    });

    describe("Validate Trigger CRUD", function () {
        const triggerCRUDTest = async function (isNameBased: boolean, isUpsertTest: boolean) {
            const client = new CosmosClient(host, { masterKey });

            // create database
            const { result: db } = await client.createDatabase({ id: "sample database" });
            // create collection
            const { result: collection } = await client.createCollection(
                TestHelpers.getDatabaseLink(isNameBased, db), { id: "sample collection" });

            // read triggers
            const { result: triggers } = await client.readTriggers(
                TestHelpers.getCollectionLink(isNameBased, db, collection)).toArray();
            assert.equal(triggers.constructor, Array, "Value should be an array");

            // create a trigger
            const beforeCreateTriggersCount = triggers.length;
            // tslint:disable:no-var-keyword
            // tslint:disable:prefer-const
            const triggerDefinition: any = {
                id: "sample trigger",
                serverScript() { var x = 10; },
                triggerType: DocumentBase.TriggerType.Pre,
                triggerOperation: DocumentBase.TriggerOperation.All,
            };
            // tslint:enable:no-var-keyword
            // tslint:enable:prefer-const

            const { result: trigger } = await TestHelpers.createOrUpsertTrigger(
                TestHelpers.getCollectionLink(isNameBased, db, collection), triggerDefinition, undefined, client, isUpsertTest);

            for (const property in triggerDefinition) {
                if (property !== "serverScript") {
                    assert.equal(trigger[property], triggerDefinition[property], "property " + property + " should match");
                } else {
                    assert.equal(trigger.body, "serverScript() { var x = 10; }");
                }
            }

            // read triggers after creation
            const { result: triggersAfterCreation } = await client.readTriggers(
                TestHelpers.getCollectionLink(isNameBased, db, collection)).toArray();
            assert.equal(triggersAfterCreation.length, beforeCreateTriggersCount + 1, "create should increase the number of triggers");

            // query triggers
            const querySpec = {
                query: "SELECT * FROM root r WHERE r.id=@id",
                parameters: [
                    {
                        name: "@id",
                        value: triggerDefinition.id,
                    },
                ],
            };
            const { result: results } = await client.queryTriggers(
                TestHelpers.getCollectionLink(isNameBased, db, collection), querySpec).toArray();
            assert(results.length > 0, "number of results for the query should be > 0");

            // replace trigger
            trigger.body = function () { const x = 20; };
            const { result: replacedTrigger } = await TestHelpers.replaceOrUpsertTrigger(
                TestHelpers.getCollectionLink(isNameBased, db, collection),
                TestHelpers.getTriggerLink(isNameBased, db, collection, trigger),
                trigger, undefined, client, isUpsertTest);
            for (const property in triggerDefinition) {
                if (property !== "serverScript") {
                    assert.equal(replacedTrigger[property], trigger[property], "property " + property + " should match");
                } else {
                    assert.equal(replacedTrigger.body, "function () { const x = 20; }");
                }
            }

            // read trigger
            const { result: triggerAfterReplace } = await client.readTrigger(
                TestHelpers.getTriggerLink(isNameBased, db, collection, replacedTrigger));
            assert.equal(replacedTrigger.id, triggerAfterReplace.id);

            // delete trigger
            const { result: res } = await client.deleteTrigger(
                TestHelpers.getTriggerLink(isNameBased, db, collection, replacedTrigger));

            // read triggers after deletion
            try {
                const { result: badtrigger } = await client.readTrigger(
                    TestHelpers.getTriggerLink(isNameBased, db, collection, replacedTrigger));
                assert.fail("Must fail to read after deletion");
            } catch (err) {
                const notFoundErrorCode = 404;
                assert.equal(err.code, notFoundErrorCode, "response should return error code 404");
            }
        };

        it("nativeApi Should do trigger CRUD operations successfully name based", async function () {
            try {
                await triggerCRUDTest(true, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do trigger CRUD operations successfully rid based", async function () {
            try {
                await triggerCRUDTest(false, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do trigger CRUD operations successfully name based with upsert", async function () {
            try {
                await triggerCRUDTest(true, true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do trigger CRUD operations successfully rid based with upsert", async function () {
            try {
                await triggerCRUDTest(false, true);
            } catch (err) {
                throw err;
            }
        });
    });

    describe("Validate UDF CRUD", function () {
        const udfCRUDTest = async function (isNameBased: boolean, isUpsertTest: boolean) {
            const client = new CosmosClient(host, { masterKey });

            // create database
            const { result: db } = await client.createDatabase({ id: "sample database" });
            // create collection
            const { result: collection } = await client.createCollection(
                TestHelpers.getDatabaseLink(isNameBased, db), { id: "sample collection" });

            // read udfs
            const { result: udfs } = await client.readUserDefinedFunctions(
                TestHelpers.getCollectionLink(isNameBased, db, collection)).toArray();
            assert.equal(udfs.constructor, Array, "Value should be an array");

            // create a udf
            const beforeCreateUdfsCount = udfs.length;
            const udfDefinition: any = {
                id: "sample udf",
                body() { const x = 10; },
            };
            const { result: udf } = await TestHelpers.createOrUpsertUserDefinedFunction(
                TestHelpers.getCollectionLink(isNameBased, db, collection),
                udfDefinition, undefined, client, isUpsertTest);
            for (const property in udfDefinition) {
                if (property !== "serverScript") {
                    assert.equal(udf[property], udfDefinition[property], "property " + property + " should match");
                } else {
                    assert.equal(udf.body, "function () { const x = 10; }");
                }
            }

            // read udfs after creation
            const { result: udfsAfterCreate } = await client.readUserDefinedFunctions(
                TestHelpers.getCollectionLink(isNameBased, db, collection)).toArray();
            assert.equal(udfsAfterCreate.length, beforeCreateUdfsCount + 1, "create should increase the number of udfs");

            // query udfs
            const querySpec = {
                query: "SELECT * FROM root r WHERE r.id=@id",
                parameters: [
                    {
                        name: "@id",
                        value: udfDefinition.id,
                    },
                ],
            };
            const { result: results } = await client.queryUserDefinedFunctions(
                TestHelpers.getCollectionLink(isNameBased, db, collection), querySpec).toArray();
            assert(results.length > 0, "number of results for the query should be > 0");

            // replace udf
            udf.body = function () { const x = 20; };
            const { result: replacedUdf } = await TestHelpers.replaceOrUpsertUserDefinedFunction(
                TestHelpers.getCollectionLink(isNameBased, db, collection),
                TestHelpers.getUserDefinedFunctionLink(isNameBased, db, collection, udf),
                udf, undefined, client, isUpsertTest);

            for (const property in udfDefinition) {
                if (property !== "serverScript") {
                    assert.equal(replacedUdf[property], udf[property], "property " + property + " should match");
                } else {
                    assert.equal(replacedUdf.body, "function () { const x = 20; }");
                }
            }

            // read udf
            const { result: udfAfterReplace } = await client.readUserDefinedFunction(
                TestHelpers.getUserDefinedFunctionLink(isNameBased, db, collection, replacedUdf));
            assert.equal(replacedUdf.id, udfAfterReplace.id);

            // delete udf
            const { result: res } = await client.deleteUserDefinedFunction(
                TestHelpers.getUserDefinedFunctionLink(isNameBased, db, collection, replacedUdf));

            // read udfs after deletion
            try {
                const { result: badudf } = await client.readUserDefinedFunction(
                    TestHelpers.getUserDefinedFunctionLink(isNameBased, db, collection, replacedUdf));
                assert.fail("Must fail to read after delete");
            } catch (err) {
                const notFoundErrorCode = 404;
                assert.equal(err.code, notFoundErrorCode, "response should return error code 404");
            }
        };

        it("nativeApi Should do UDF CRUD operations successfully name based", async function () {
            try {
                await udfCRUDTest(true, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do UDF CRUD operations successfully rid based", async function () {
            try {
                await udfCRUDTest(false, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do UDF CRUD operations successfully name based with upsert", async function () {
            try {
                await udfCRUDTest(true, true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do UDF CRUD operations successfully rid based with upsert", async function () {
            try {
                await udfCRUDTest(false, true);
            } catch (err) {
                throw err;
            }
        });
    });

    describe("Validate sproc CRUD", function () {
        const sprocCRUDTest = async function (isNameBased: boolean, isUpsertTest: boolean) {
            const client = new CosmosClient(host, { masterKey });

            // create database
            const { result: db } = await client.createDatabase({ id: "sample database" });
            // create collection
            const { result: collection } = await client.createCollection(
                TestHelpers.getDatabaseLink(isNameBased, db), { id: "sample collection" });

            // read sprocs
            const { result: sprocs } = await client.readStoredProcedures(
                TestHelpers.getCollectionLink(isNameBased, db, collection)).toArray();
            assert.equal(sprocs.constructor, Array, "Value should be an array");

            // create a sproc
            const beforeCreateSprocsCount = sprocs.length;
            const sprocDefinition: any = {
                id: "sample sproc",
                body() { const x = 10; },
            };
            const { result: sproc } = await TestHelpers.createOrUpsertStoredProcedure(
                TestHelpers.getCollectionLink(isNameBased, db, collection),
                sprocDefinition, undefined, client, isUpsertTest);
            for (const property in sprocDefinition) {
                if (property !== "serverScript") {
                    assert.equal(sproc[property], sprocDefinition[property], "property " + property + " should match");
                } else {
                    assert.equal(sproc.body, "function () { const x = 10; }");
                }
            }

            // read sprocs after creation
            const { result: sprocsAfterCreation } = await client.readStoredProcedures(
                TestHelpers.getCollectionLink(isNameBased, db, collection)).toArray();
            assert.equal(sprocsAfterCreation.length, beforeCreateSprocsCount + 1, "create should increase the number of sprocs");

            // query sprocs
            const querySpec = {
                query: "SELECT * FROM root r",
            };
            const { result: queriedSprocs } = await client.queryStoredProcedures(
                TestHelpers.getCollectionLink(isNameBased, db, collection), querySpec).toArray();
            assert(queriedSprocs.length > 0, "number of sprocs for the query should be > 0");

            // replace sproc
            sproc.body = function () { const x = 20; };
            const { result: replacedSproc } = await TestHelpers.replaceOrUpsertStoredProcedure(
                TestHelpers.getCollectionLink(isNameBased, db, collection),
                TestHelpers.getStoredProcedureLink(isNameBased, db, collection, sproc),
                sproc, undefined, client, isUpsertTest);
            for (const property in sprocDefinition) {
                if (property !== "serverScript") {
                    assert.equal(replacedSproc[property], sproc[property], "property " + property + " should match");
                } else {
                    assert.equal(replacedSproc.body, "function () { const x = 20; }");
                }
            }

            // read sproc
            const { result: sprocAfterReplace } = await client.readStoredProcedure(
                TestHelpers.getStoredProcedureLink(isNameBased, db, collection, replacedSproc));
            assert.equal(replacedSproc.id, sprocAfterReplace.id);

            // delete sproc
            const { result: res } = await client.deleteStoredProcedure(
                TestHelpers.getStoredProcedureLink(isNameBased, db, collection, replacedSproc));

            // read sprocs after deletion
            try {
                const { result: badsproc } = await client.readStoredProcedure(
                    TestHelpers.getStoredProcedureLink(isNameBased, db, collection, replacedSproc));
                assert.fail("Must fail to read sproc after deletion");
            } catch (err) {
                const notFoundErrorCode = 404;
                assert.equal(err.code, notFoundErrorCode, "response should return error code 404");
            }
        };

        it("nativeApi Should do sproc CRUD operations successfully name based", async function () {
            try {
                await sprocCRUDTest(true, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do sproc CRUD operations successfully rid based", async function () {
            try {
                await sprocCRUDTest(false, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do sproc CRUD operations successfully name based with upsert", async function () {
            try {
                await sprocCRUDTest(true, true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do sproc CRUD operations successfully rid based with upsert", async function () {
            try {
                await sprocCRUDTest(false, true);
            } catch (err) {
                throw err;
            }
        });
    });

    describe("Validate spatial index", function () {
        const spatialIndexTest = async function (isNameBased: boolean, isUpsertTest: boolean) {
            try {
                const client = new CosmosClient(host, { masterKey });

                // create database
                const { result: db } = await client.createDatabase({ id: "sample database" });

                // create collection using an indexing policy with spatial index.
                const indexingPolicy = {
                    includedPaths: [
                        {
                            path: "/\"Location\"/?",
                            indexes: [
                                {
                                    kind: DocumentBase.IndexKind.Spatial,
                                    dataType: DocumentBase.DataType.Point,
                                },
                            ],
                        },
                        {
                            path: "/",
                        },
                    ],
                };
                const { result: collection } = await client.createCollection(
                    TestHelpers.getDatabaseLink(isNameBased, db), { id: "sample collection", indexingPolicy });
                const location1 = {
                    id: "location1",
                    Location: {
                        type: "Point",
                        coordinates: [20.0, 20.0],
                    },
                };
                await TestHelpers.createOrUpsertDocument(
                    TestHelpers.getCollectionLink(isNameBased, db, collection),
                    location1, undefined, client, isUpsertTest);
                const location2 = {
                    id: "location2",
                    Location: {
                        type: "Point",
                        coordinates: [100.0, 100.0],
                    },
                };
                await TestHelpers.createOrUpsertDocument(
                    TestHelpers.getCollectionLink(isNameBased, db, collection),
                    location2, undefined, client, isUpsertTest);
                const query = "SELECT * FROM root WHERE (ST_DISTANCE(root.Location, {type: 'Point', coordinates: [20.1, 20]}) < 20000) ";
                const { result: results } = await client.queryDocuments(
                    TestHelpers.getCollectionLink(isNameBased, db, collection), query).toArray();
                assert.equal(1, results.length);
                assert.equal("location1", results[0].id);
            } catch (err) {
                throw err;
            }
        };

        it("nativeApi Should support spatial index name based", async function () {
            try {
                await spatialIndexTest(true, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should support spatial index rid based", async function () {
            try {
                await spatialIndexTest(false, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should support spatial index name based with upsert", async function () {
            try {
                await spatialIndexTest(true, true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should support spatial index rid based with upsert", async function () {
            try {
                await spatialIndexTest(false, true);
            } catch (err) {
                throw err;
            }
        });
    });

    describe("Validate collection indexing policy", function () {
        const indexPolicyTest = async function (isNameBased: boolean) {
            try {
                const client = new CosmosClient(host, { masterKey });
                // create database
                const { result: db } = await client.createDatabase({ id: "sample database" });

                // create collection
                const { result: collection } = await client.createCollection(
                    TestHelpers.getDatabaseLink(isNameBased, db), { id: "sample collection" });

                assert.equal(collection.indexingPolicy.indexingMode, DocumentBase.IndexingMode.Consistent, "default indexing mode should be consistent");
                const lazyCollectionDefinition = { id: "lazy collection", indexingPolicy: { indexingMode: DocumentBase.IndexingMode.Lazy } };
                await client.deleteCollection(
                    TestHelpers.getCollectionLink(isNameBased, db, collection));

                const { result: lazyCollection } = await client.createCollection(
                    TestHelpers.getDatabaseLink(isNameBased, db), lazyCollectionDefinition);

                assert.equal(lazyCollection.indexingPolicy.indexingMode, DocumentBase.IndexingMode.Lazy, "indexing mode should be lazy");
                const consistentCollectionDefinition = { id: "lazy collection", indexingPolicy: { indexingMode: DocumentBase.IndexingMode.Consistent } };
                await client.deleteCollection(
                    TestHelpers.getCollectionLink(isNameBased, db, lazyCollection));
                const { result: consistentCollection } = await client.createCollection(
                    TestHelpers.getDatabaseLink(isNameBased, db), consistentCollectionDefinition);
                assert.equal(collection.indexingPolicy.indexingMode, DocumentBase.IndexingMode.Consistent, "indexing mode should be consistent");
                const collectionDefinition = {
                    id: "CollectionWithIndexingPolicy",
                    indexingPolicy: {
                        automatic: true,
                        indexingMode: DocumentBase.IndexingMode.Consistent,
                        includedPaths: [
                            {
                                path: "/",
                                indexes: [
                                    {
                                        kind: DocumentBase.IndexKind.Hash,
                                        dataType: DocumentBase.DataType.Number,
                                        precision: 2,
                                    },
                                ],
                            },
                        ],
                        excludedPaths: [
                            {
                                path: "/\"systemMetadata\"/*",
                            },
                        ],
                    },

                };

                const { result: coll } = await client.deleteCollection(
                    TestHelpers.getCollectionLink(isNameBased, db, consistentCollection));
                const { result: collectionWithIndexingPolicy } = await client.createCollection(
                    TestHelpers.getDatabaseLink(isNameBased, db), collectionDefinition);

                // Two included paths.
                assert.equal(1, collectionWithIndexingPolicy.indexingPolicy.includedPaths.length, "Unexpected includedPaths length");
                // The first included path is what we created.
                assert.equal("/", collectionWithIndexingPolicy.indexingPolicy.includedPaths[0].path);
                assert(collectionWithIndexingPolicy.indexingPolicy.includedPaths[0].indexes.length > 1);  // Backend adds a default index
                assert.equal(DocumentBase.IndexKind.Hash, collectionWithIndexingPolicy.indexingPolicy.includedPaths[0].indexes[0].kind);
                // The second included path is a timestamp index created by the server.

                // And one excluded path.
                assert.equal(1, collectionWithIndexingPolicy.indexingPolicy.excludedPaths.length, "Unexpected excludedPaths length");
                assert.equal("/\"systemMetadata\"/*", collectionWithIndexingPolicy.indexingPolicy.excludedPaths[0].path);
            } catch (err) {
                throw err;
            }

        };

        it("nativeApi Should create collection with correct indexing policy name based", async function () {
            try {
                await indexPolicyTest(true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should create collection with correct indexing policy rid based", async function () {
            try {
                await indexPolicyTest(false);
            } catch (err) {
                throw err;
            }
        });

        const checkDefaultIndexingPolicyPaths = function (indexingPolicy: any) {
            // no excluded paths.
            assert.equal(0, indexingPolicy["excludedPaths"].length);
            // included paths should be 1 "/".
            assert.equal(1, indexingPolicy["includedPaths"].length);

            let rootIncludedPath: any = null;
            if (indexingPolicy["includedPaths"][0]["path"] === "/*") {
                rootIncludedPath = indexingPolicy["includedPaths"][0];
            }

            assert(rootIncludedPath);  // root path should exist.

            // In the root path, there should be one HashIndex for Strings, and one RangeIndex for Numbers.
            assert.equal(2, rootIncludedPath["indexes"].length);

            let hashIndex: any = null;
            let rangeIndex: any = null;

            for (let i = 0; i < 2; ++i) {
                if (rootIncludedPath["indexes"][i]["kind"] === "Hash") {
                    hashIndex = rootIncludedPath["indexes"][i];
                } else if (rootIncludedPath["indexes"][i]["kind"] === "Range") {
                    rangeIndex = rootIncludedPath["indexes"][i];
                }
            }

            assert(hashIndex);
            assert.equal("String", hashIndex["dataType"]);
            assert(rangeIndex);
            assert.equal("Number", rangeIndex["dataType"]);
        };

        const defaultIndexingPolicyTest = async function (isNameBased: boolean) {
            try {
                const client = new CosmosClient(host, { masterKey });
                // create database
                const { result: db } = await client.createDatabase({ id: "sample database" });
                // create collection with no indexing policy specified.
                const collectionDefinition01 = { id: "TestCreateDefaultPolicy01" };
                const { result: collectionNoIndexPolicy } = await client.createCollection(
                    TestHelpers.getDatabaseLink(isNameBased, db), collectionDefinition01);
                checkDefaultIndexingPolicyPaths(collectionNoIndexPolicy["indexingPolicy"]);

                // create collection with partial policy specified.
                const collectionDefinition02 = {
                    id: "TestCreateDefaultPolicy02",
                    indexingPolicy: {
                        indexingMode: "Lazy",
                        automatic: true,
                    },
                };

                const { result: collectionWithPartialPolicy } = await client.createCollection(
                    TestHelpers.getDatabaseLink(isNameBased, db), collectionDefinition02);
                checkDefaultIndexingPolicyPaths(collectionWithPartialPolicy["indexingPolicy"]);

                // create collection with default policy.
                const collectionDefinition03 = {
                    id: "TestCreateDefaultPolicy03",
                    indexingPolicy: {},
                };
                const { result: collectionDefaultPolicy } = await client.createCollection(
                    TestHelpers.getDatabaseLink(isNameBased, db), collectionDefinition03);
                checkDefaultIndexingPolicyPaths(collectionDefaultPolicy["indexingPolicy"]);

                // create collection with indexing policy missing indexes.
                const collectionDefinition04 = {
                    id: "TestCreateDefaultPolicy04",
                    indexingPolicy: {
                        includedPaths: [
                            {
                                path: "/*",
                            },
                        ],
                    },
                };
                const { result: collectionMissingIndexes } = await client.createCollection(
                    TestHelpers.getDatabaseLink(isNameBased, db), collectionDefinition04);
                checkDefaultIndexingPolicyPaths(collectionMissingIndexes["indexingPolicy"]);

                // create collection with indexing policy missing precision.
                const collectionDefinition05 = {
                    id: "TestCreateDefaultPolicy05",
                    indexingPolicy: {
                        includedPaths: [
                            {
                                path: "/*",
                                indexes: [
                                    {
                                        kind: "Hash",
                                        dataType: "String",
                                    },
                                    {
                                        kind: "Range",
                                        dataType: "Number",
                                    },
                                ],
                            },
                        ],
                    },
                };
                const { result: collectionMissingPrecision } = await client.createCollection(
                    TestHelpers.getDatabaseLink(isNameBased, db), collectionDefinition05);
                checkDefaultIndexingPolicyPaths(collectionMissingPrecision["indexingPolicy"]);
            } catch (err) {
                throw err;
            }
        };

        it("nativeApi Should create collection with default indexing policy name based", async function () {
            try {
                await defaultIndexingPolicyTest(true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should create collection with default indexing policy rid based", async function () {
            try {
                await defaultIndexingPolicyTest(false);
            } catch (err) {
                throw err;
            }
        });
    });

    // TODO: disabled tests need to get fixed or deleted
    describe.skip("Validate client request timeout", function () {
        it("nativeApi Client Should throw exception", async function () {
            const connectionPolicy = new DocumentBase.ConnectionPolicy();
            // making timeout 5 ms to make sure it will throw(create database request takes 10ms-15ms to finish on emulator)
            connectionPolicy.RequestTimeout = 5;
            const client = new CosmosClient(host, { masterKey }, connectionPolicy);
            // create database
            try {
                const { result: db } = await client.createDatabase({ id: "sample database" });
                assert.fail("Must throw when trying to connect to database");
            } catch (err) {
                assert.equal(err.code, "ECONNRESET", "client should throw exception");
            }
        });
    });

    describe("Validate QueryIterator Functionality For Multiple Partition Collection", function () {

        const client = new CosmosClient(host, { masterKey });

        const documentDefinitions = [
            { id: "document1" },
            { id: "document2", key: null, prop: 1 },
            { id: "document3", key: false, prop: 1 },
            { id: "document4", key: true, prop: 1 },
            { id: "document5", key: 1, prop: 1 },
            { id: "document6", key: "A", prop: 1 },
        ];

        let db: any;
        let collection: any;
        const isNameBased = false;

        // creates a new database, creates a new collecton, bulk inserts documents to the collection
        beforeEach(async function () {
            try {
                const { result: createdDB } = await client.createDatabase({ id: "sample 中文 database" });
                db = createdDB;

                const partitionKey = "key";
                const collectionDefinition = {
                    id: "coll1",
                    partitionKey: {
                        paths: ["/" + partitionKey],
                        kind: DocumentBase.PartitionKind.Hash,
                    },
                };

                const collectionOptions = { offerThroughput: 12000 };
                const { result: createdCollection } =
                    await client.createCollection("dbs/sample 中文 database", collectionDefinition, collectionOptions);
                collection = createdCollection;

                const insertedDocs =
                    await TestHelpers.bulkInsertDocuments(client, isNameBased, db, collection, documentDefinitions);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi validate QueryIterator nextItem on Multiple Partition Colleciton", async function () {
            try {
                // obtain an instance of queryIterator
                const queryIterator = client.queryDocuments(
                    TestHelpers.getCollectionLink(isNameBased, db, collection));
                let cnt = 0;
                while (queryIterator.hasMoreResults()) {
                    const { result: resource } = await queryIterator.nextItem();
                    cnt++;
                }
                assert.equal(cnt, documentDefinitions.length);
            } catch (err) {
                throw err;
            }
        });
    });

    describe("Validate QueryIterator Functionality", function () {
        this.timeout(30000);
        const createResources = async function (isNameBased: boolean, client: CosmosClient) {
            try {
                const { result: db } = await client.createDatabase({ id: "sample database" + Math.random() });
                const { result: collection } = await client.createCollection(
                    TestHelpers.getDatabaseLink(isNameBased, db), { id: "sample collection" });
                const { result: doc1 } = await client.createDocument(
                    TestHelpers.getCollectionLink(isNameBased, db, collection), { id: "doc1", prop1: "value1" });
                const { result: doc2 } = await client.createDocument(
                    TestHelpers.getCollectionLink(isNameBased, db, collection), { id: "doc2", prop1: "value2" });
                const { result: doc3 } = await client.createDocument(
                    TestHelpers.getCollectionLink(isNameBased, db, collection), { id: "doc3", prop1: "value3" });
                const resources = {
                    db,
                    coll: collection,
                    doc1,
                    doc2,
                    doc3,
                };
                return resources;
            } catch (err) {
                throw err;
            }
        };

        const queryIteratorToArrayTest = async function (isNameBased: boolean) {
            try {
                const client = new CosmosClient(host, { masterKey });
                const resources = await createResources(isNameBased, client);
                const queryIterator = client.readDocuments(
                    TestHelpers.getCollectionLink(isNameBased, resources.db, resources.coll), { maxItemCount: 2 });
                const { result: docs } = await queryIterator.toArray();
                assert.equal(docs.length, 3, "queryIterator should return all documents using continuation");
                assert.equal(docs[0].id, resources.doc1.id);
                assert.equal(docs[1].id, resources.doc2.id);
                assert.equal(docs[2].id, resources.doc3.id);
            } catch (err) {
                throw err;
            }
        };

        it("nativeApi validate QueryIterator iterator toArray name based", async function () {
            try {
                await queryIteratorToArrayTest(true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi validate QueryIterator iterator toArray rid based", async function () {
            try {
                await queryIteratorToArrayTest(false);
            } catch (err) {
                throw err;
            }
        });

        const queryIteratorForEachTest = async function (isNameBased: boolean) {
            const client = new CosmosClient(host, { masterKey });
            const resources = await createResources(isNameBased, client);
            const queryIterator = client.readDocuments(
                TestHelpers.getCollectionLink(isNameBased, resources.db, resources.coll), { maxItemCount: 2 });
            let counter = 0;
            // test queryIterator.forEach
            return new Promise((resolve, reject) => {
                queryIterator.forEach((err, doc) => {
                    try {
                        counter++;
                        if (counter === 1) {
                            assert.equal(doc.id, resources.doc1.id, "first document should be doc1");
                        } else if (counter === 2) {
                            assert.equal(doc.id, resources.doc2.id, "second document should be doc2");
                        } else if (counter === 3) {
                            assert.equal(doc.id, resources.doc3.id, "third document should be doc3");
                        }

                        if (doc === undefined) {
                            assert(counter < 5, "iterator should have stopped");
                            resolve();
                        }
                    } catch (err) {
                        reject(err);
                    }
                });
            });
        };

        it("nativeApi validate queryIterator iterator forEach name based", async function () {
            try {
                await queryIteratorForEachTest(true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi validate queryIterator iterator forEach rid based", async function () {
            try {
                await queryIteratorForEachTest(false);
            } catch (err) {
                throw err;
            }
        });

        const queryIteratorNextAndMoreTest = async function (isNameBased: boolean) {
            try {
                const client = new CosmosClient(host, { masterKey });
                const resources = await createResources(isNameBased, client);
                const queryIterator = client.readDocuments(
                    TestHelpers.getCollectionLink(isNameBased, resources.db, resources.coll), { maxItemCount: 2 });
                assert.equal(queryIterator.hasMoreResults(), true);
                const { result: doc1 } = await queryIterator.current();
                assert.equal(doc1.id, resources.doc1.id, "call queryIterator.current after reset should return first document");
                const { result: doc2 } = await queryIterator.nextItem();
                assert.equal(doc2.id, resources.doc1.id, "call queryIterator.nextItem after reset should return first document");
                assert.equal(queryIterator.hasMoreResults(), true);
                const { result: doc3 } = await queryIterator.current();
                assert.equal(doc3.id, resources.doc2.id, "call queryIterator.current should return second document");
                const { result: doc4 } = await queryIterator.nextItem();
                assert.equal(doc4.id, resources.doc2.id, "call queryIterator.nextItem again should return second document");
                assert.equal(queryIterator.hasMoreResults(), true);
                const { result: doc5 } = await queryIterator.current();
                assert.equal(doc5.id, resources.doc3.id, "call queryIterator.current should return third document");
                const { result: doc6 } = await queryIterator.nextItem();
                assert.equal(doc6.id, resources.doc3.id, "call queryIterator.nextItem again should return third document");
                const { result: doc7 } = await queryIterator.nextItem();
                assert.equal(doc7, undefined, "queryIterator should return undefined if there is no elements");
            } catch (err) {
                throw err;
            }
        };

        it("nativeApi validate queryIterator nextItem and hasMoreResults name based", async function () {
            try {
                await queryIteratorNextAndMoreTest(true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi validate queryIterator nextItem and hasMoreResults rid based", async function () {
            try {
                await queryIteratorNextAndMoreTest(false);
            } catch (err) {
                throw err;
            }
        });

        const queryIteratorExecuteNextTest = async function (isNameBased: boolean) {
            const client = new CosmosClient(host, { masterKey });
            const resources = await createResources(isNameBased, client);
            let queryIterator = client.readDocuments(
                TestHelpers.getCollectionLink(isNameBased, resources.db, resources.coll), { maxItemCount: 2 });
            const { result: docs, headers } = await queryIterator.executeNext();

            assert(headers !== undefined, "executeNext should pass headers as the third parameter to the callback");
            assert(headers[Constants.HttpHeaders.RequestCharge] > 0, "RequestCharge has to be non-zero");
            assert.equal(docs.length, 2, "first batch size should be 2");
            assert.equal(docs[0].id, resources.doc1.id, "first batch first document should be doc1");
            assert.equal(docs[1].id, resources.doc2.id, "batch first second document should be doc2");
            const { result: docs2 } = await queryIterator.executeNext();
            assert.equal(docs2.length, 1, "second batch size is unexpected");
            assert.equal(docs2[0].id, resources.doc3.id, "second batch element should be doc3");

            // validate Iterator.executeNext with continuation token
            queryIterator = client.readDocuments(
                TestHelpers.getCollectionLink(isNameBased, resources.db, resources.coll),
                { maxItemCount: 2, continuation: headers[Constants.HttpHeaders.Continuation] as string });
            const { result: docsWithContinuation, headers: headersWithContinuation } = await queryIterator.executeNext();
            assert(headersWithContinuation !== undefined, "executeNext should pass headers as the third parameter to the callback");
            assert(headersWithContinuation[Constants.HttpHeaders.RequestCharge] > 0, "RequestCharge has to be non-zero");
            assert.equal(docsWithContinuation.length, 1, "second batch size with continuation token is unexpected");
            assert.equal(docsWithContinuation[0].id, resources.doc3.id, "second batch element should be doc3");
        };

        it("nativeApi validate queryIterator iterator executeNext name based", async function () {
            try {
                await queryIteratorExecuteNextTest(true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi validate queryIterator iterator executeNext rid based", async function () {
            try {
                await queryIteratorExecuteNextTest(false);
            } catch (err) {
                throw err;
            }
        });
    });

    describe("validate trigger functionality", function () {
        const triggers: any = [
            {
                id: "t1",
                // tslint:disable:no-var-keyword
                // tslint:disable:prefer-const
                // tslint:disable:curly
                // tslint:disable:no-string-throw
                body() {
                    var item = getContext().getRequest().getBody();
                    item.id = item.id.toUpperCase() + "t1";
                    getContext().getRequest().setBody(item);
                },
                triggerType: DocumentBase.TriggerType.Pre,
                triggerOperation: DocumentBase.TriggerOperation.All,
            },
            {
                id: "t2",
                body: "function() { }", // trigger already stringified
                triggerType: DocumentBase.TriggerType.Pre,
                triggerOperation: DocumentBase.TriggerOperation.All,
            },
            {
                id: "t3",
                body() {
                    const item = getContext().getRequest().getBody();
                    item.id = item.id.toLowerCase() + "t3";
                    getContext().getRequest().setBody(item);
                },
                triggerType: DocumentBase.TriggerType.Pre,
                triggerOperation: DocumentBase.TriggerOperation.All,
            },
            {
                id: "response1",
                body() {
                    const prebody = getContext().getRequest().getBody();
                    if (prebody.id !== "TESTING POST TRIGGERt1") throw "name mismatch";
                    const postbody = getContext().getResponse().getBody();
                    if (postbody.id !== "TESTING POST TRIGGERt1") throw "name mismatch";
                },
                triggerType: DocumentBase.TriggerType.Post,
                triggerOperation: DocumentBase.TriggerOperation.All,
            },
            {
                id: "triggerOpType",
                body: "function() { }",
                triggerType: DocumentBase.TriggerType.Post,
                triggerOperation: DocumentBase.TriggerOperation.Delete,
            },
        ];
        // tslint:enable:no-var-keyword
        // tslint:enable:prefer-const
        // tslint:enable:curly
        // tslint:enable:no-string-throw

        const createTriggers = async function (client: CosmosClient, collection: any, isUpsertTest: boolean) {
            for (const trigger of triggers) {
                const { result: createdTrigger } = await TestHelpers.createOrUpsertTrigger(collection._self, trigger, undefined, client, isUpsertTest);
                for (const property in trigger) {
                    if (trigger.hasOwnProperty(property)) {
                        assert.equal(createdTrigger[property], trigger[property], "property " + property + " should match");
                    }
                }
            }
        };

        const triggerCRUDTest = async function (isNameBased: boolean, isUpsertTest: boolean) {
            const client = new CosmosClient(host, { masterKey });

            // create database
            const { result: db } = await client.createDatabase({ id: "sample database" });
            // create collection
            const { result: collection } = await client.createCollection(
                TestHelpers.getDatabaseLink(isNameBased, db), { id: "sample collection" });
            // create triggers
            await createTriggers(client, collection, isUpsertTest);
            // create document
            const { result: createdTriggers } = await client.readTriggers(
                TestHelpers.getCollectionLink(isNameBased, db, collection)).toArray();
            const { result: document } = await TestHelpers.createOrUpsertDocument(
                TestHelpers.getCollectionLink(isNameBased, db, collection), { id: "doc1", key: "value" }, { preTriggerInclude: "t1" }, client, isUpsertTest);
            assert.equal(document.id, "DOC1t1", "name should be capitalized");
            const { result: document2 } = await TestHelpers.createOrUpsertDocument(
                TestHelpers.getCollectionLink(isNameBased, db, collection), { id: "doc2", key2: "value2" }, { preTriggerInclude: "t2" }, client, isUpsertTest);
            assert.equal(document2.id, "doc2", "name shouldn't change");
            const { result: document3 } = await TestHelpers.createOrUpsertDocument(
                TestHelpers.getCollectionLink(isNameBased, db, collection), { id: "Doc3", prop: "empty" }, { preTriggerInclude: "t3" }, client, isUpsertTest);
            assert.equal(document3.id, "doc3t3");
            const { result: document4 } = await TestHelpers.createOrUpsertDocument(
                TestHelpers.getCollectionLink(isNameBased, db, collection), { id: "testing post trigger" }, { postTriggerInclude: "response1", preTriggerInclude: "t1" }, client, isUpsertTest);
            assert.equal(document4.id, "TESTING POST TRIGGERt1");
            const { result: document5, headers } = await TestHelpers.createOrUpsertDocument(
                TestHelpers.getCollectionLink(isNameBased, db, collection), { id: "responseheaders" }, { preTriggerInclude: "t1" }, client, isUpsertTest);
            assert.equal(document5.id, "RESPONSEHEADERSt1");
            const { result: document6 } = await TestHelpers.createOrUpsertDocument(
                TestHelpers.getCollectionLink(isNameBased, db, collection), { id: "Docoptype" }, { postTriggerInclude: "triggerOpType" }, client, isUpsertTest);
        };

        it("nativeApi Should do trigger operations successfully name based", async function () {
            try {
                await triggerCRUDTest(true, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do trigger operations successfully rid based", async function () {
            try {
                await triggerCRUDTest(false, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do trigger operations successfully name based", async function () {
            try {
                await triggerCRUDTest(true, true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do trigger operations successfully rid based", async function () {
            try {
                await triggerCRUDTest(false, true);
            } catch (err) {
                throw err;
            }
        });
    });

    describe("validate stored procedure functionality", function () {
        const storedProcedureCRUDTest = async function (isNameBased: boolean, isUpsertTest: boolean) {
            const client = new CosmosClient(host, { masterKey });

            // create database
            const { result: db } = await client.createDatabase({ id: "sample database" });
            // create collection
            const { result: collection } = await client.createCollection(
                TestHelpers.getDatabaseLink(isNameBased, db), { id: "sample collection" });
            // tslint:disable:no-var-keyword
            // tslint:disable:prefer-const
            // tslint:disable:curly
            // tslint:disable:no-string-throw
            const sproc1 = {

                id: "storedProcedure1",
                body() {
                    for (var i = 0; i < 1000; i++) {
                        const item = getContext().getResponse().getBody();
                        if (i > 0 && item !== i - 1) throw "body mismatch";
                        getContext().getResponse().setBody(i);
                    }
                },
            };

            const sproc2 = {
                id: "storedProcedure2",
                body() {
                    for (var i = 0; i < 10; i++) getContext().getResponse().appendValue("Body", i);
                },
            };

            const sproc3 = {
                id: "storedProcedure3",
                // TODO: I put any in here, but not sure how this will work...
                body(input: any) {
                    getContext().getResponse().setBody("a" + input.temp);
                },
            };

            // tslint:enable:no-var-keyword
            // tslint:enable:prefer-const
            // tslint:enable:curly
            // tslint:enable:no-string-throw

            const { result: retrievedSproc } = await TestHelpers.createOrUpsertStoredProcedure(
                TestHelpers.getCollectionLink(isNameBased, db, collection), sproc1, undefined, client, isUpsertTest);
            const { result: result } = await client.executeStoredProcedure(
                TestHelpers.getStoredProcedureLink(isNameBased, db, collection, retrievedSproc));
            assert.equal(result, 999);

            const { result: retrievedSproc2 } = await TestHelpers.createOrUpsertStoredProcedure(
                TestHelpers.getCollectionLink(isNameBased, db, collection), sproc2, undefined, client, isUpsertTest);
            const { result: result2 } = await client.executeStoredProcedure(
                TestHelpers.getStoredProcedureLink(isNameBased, db, collection, retrievedSproc2));
            assert.equal(result2, 123456789);

            const { result: retrievedSproc3 } = await TestHelpers.createOrUpsertStoredProcedure(
                TestHelpers.getCollectionLink(isNameBased, db, collection), sproc3, undefined, client, isUpsertTest);
            const { result: result3 } = await client.executeStoredProcedure(
                TestHelpers.getStoredProcedureLink(isNameBased, db, collection, retrievedSproc3), [{ temp: "so" }]);
            assert.equal(result3, "aso");
        };

        const executeStoredProcedureWithPartitionKey = async function (isNameBased: boolean) {
            const client = new CosmosClient(host, { masterKey });
            const { result: db } = await client.createDatabase({ id: "sample database" });
            // create collection
            const partitionKey = "key";

            const collectionDefinition = {
                id: "coll1",
                partitionKey: { paths: ["/" + partitionKey], kind: DocumentBase.PartitionKind.Hash },
            };

            const { result: collection } = await client.createCollection(
                TestHelpers.getDatabaseLink(isNameBased, db), collectionDefinition, { offerThroughput: 12000 });
            // tslint:disable:no-var-keyword
            // tslint:disable:prefer-const
            // tslint:disable:curly
            // tslint:disable:no-string-throw
            // tslint:disable:no-shadowed-variable
            const querySproc = {
                id: "querySproc",
                body() {
                    var context = getContext();
                    var collection = context.getCollection();
                    var response = context.getResponse();

                    // query for players
                    var query = "SELECT r.id, r.key, r.prop FROM r";
                    var accept = collection.queryDocuments(collection.getSelfLink(), query, {}, function (err: any, documents: any, responseOptions: any) {
                        if (err) throw new Error("Error" + err.message);
                        response.setBody(documents);
                    });

                    if (!accept) throw "Unable to read player details, abort ";
                },
            };
            // tslint:enable:no-var-keyword
            // tslint:enable:prefer-const
            // tslint:enable:curly
            // tslint:enable:no-string-throw
            // tslint:enable:no-shadowed-variable

            const documents = [
                { id: "document1" },
                { id: "document2", key: null, prop: 1 },
                { id: "document3", key: false, prop: 1 },
                { id: "document4", key: true, prop: 1 },
                { id: "document5", key: 1, prop: 1 },
                { id: "document6", key: "A", prop: 1 },
            ];

            const returnedDocuments = await TestHelpers.bulkInsertDocuments(client, isNameBased, db, collection, documents);
            const { result: sproc } = await client.createStoredProcedure(
                TestHelpers.getCollectionLink(isNameBased, db, collection), querySproc);
            const { result: result } = await client.executeStoredProcedure(
                TestHelpers.getStoredProcedureLink(isNameBased, db, collection, sproc), [], { partitionKey: null });
            assert(result !== undefined);
            assert.equal(result.length, 1);
            assert.equal(JSON.stringify(result[0]), JSON.stringify(documents[1]));
            const { result: result2 } = await client.executeStoredProcedure(
                TestHelpers.getStoredProcedureLink(isNameBased, db, collection, sproc), null, { partitionKey: 1 });
            assert(result2 !== undefined);
            assert.equal(result2.length, 1);
            assert.equal(JSON.stringify(result2[0]), JSON.stringify(documents[4]));
        };

        it("nativeApi Should do stored procedure operations successfully name based", async function () {
            try {
                await storedProcedureCRUDTest(true, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do stored procedure operations successfully rid based", async function () {
            try {
                await storedProcedureCRUDTest(false, false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do stored procedure operations successfully name based with upsert", async function () {
            try {
                await storedProcedureCRUDTest(true, true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do stored procedure operations successfully rid based with upsert", async function () {
            try {
                await storedProcedureCRUDTest(false, true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should execute stored procedure with partition key successfully name based", async function () {
            try {
                await executeStoredProcedureWithPartitionKey(true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should execute stored procedure with partition key successfully rid based", async function () {
            try {
                await executeStoredProcedureWithPartitionKey(false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should enable/disable script logging while executing stored procedure", async function () {
            const client = new CosmosClient(host, { masterKey });
            const { result: db } = await client.createDatabase({ id: "sample database" });
            // create collection
            const collectionDefinition = { id: "sample collection" };

            const { result: collection } = await client.createCollection(
                TestHelpers.getDatabaseLink(true, db), collectionDefinition);
            // tslint:disable:no-var-keyword
            // tslint:disable:prefer-const
            // tslint:disable:curly
            // tslint:disable:no-string-throw
            // tslint:disable:no-shadowed-variable
            // tslint:disable:one-line
            const sproc1 = {
                id: "storedProcedure",
                body() {
                    const mytext = "x";
                    const myval = 1;
                    try {
                        console.log("The value of %s is %s.", mytext, myval);
                        getContext().getResponse().setBody("Success!");
                    }
                    catch (err) {
                        getContext().getResponse().setBody("inline err: [" + err.number + "] " + err);
                    }
                },
            };

            // tslint:enable:no-var-keyword
            // tslint:enable:prefer-const
            // tslint:enable:curly
            // tslint:enable:no-string-throw
            // tslint:enable:no-shadowed-variable
            // tslint:disable:one-line

            const { result: retrievedSproc } = await client.createStoredProcedure(
                TestHelpers.getCollectionLink(true, db, collection), sproc1);
            const { result: result1, headers: headers1 } = await client.executeStoredProcedure(
                TestHelpers.getStoredProcedureLink(true, db, collection, retrievedSproc));
            assert.equal(result1, "Success!");
            assert.equal(headers1[Constants.HttpHeaders.ScriptLogResults], undefined);

            let requestOptions = { enableScriptLogging: true };
            const { result: result2, headers: headers2 } = await client.executeStoredProcedure(
                TestHelpers.getStoredProcedureLink(true, db, collection, retrievedSproc), undefined, requestOptions);
            assert.equal(result2, "Success!");
            assert.equal(headers2[Constants.HttpHeaders.ScriptLogResults], "The value of x is 1.");

            requestOptions = { enableScriptLogging: false };
            const { result: result3, headers: headers3 } = await client.executeStoredProcedure(
                TestHelpers.getStoredProcedureLink(true, db, collection, retrievedSproc), undefined, requestOptions);
            assert.equal(result3, "Success!");
            assert.equal(headers3[Constants.HttpHeaders.ScriptLogResults], undefined);

        });
    });

    describe("Validate Offer CRUD", function () {
        const validateOfferResponseBody = function (offer: any, expectedCollLink: string, expectedOfferType: string) {
            assert(offer.id, "Id cannot be null");
            assert(offer._rid, "Resource Id (Rid) cannot be null");
            assert(offer._self, "Self Link cannot be null");
            assert(offer.resource, "Resource Link cannot be null");
            assert(offer._self.indexOf(offer.id) !== -1, "Offer id not contained in offer self link.");
            assert.equal(expectedCollLink.replace(/^\/|\/$/g, ""), offer.resource.replace(/^\/|\/$/g, ""));
            if (expectedOfferType) {
                assert.equal(expectedOfferType, offer.offerType);
            }
        };

        const offerReadAndQueryTest = async function (isNameBased: boolean, isPartitionedCollection: boolean, offerThroughput: number, expectedCollectionSize: number) {
            const client = new CosmosClient(host, { masterKey });
            // create database
            const { result: db } = await client.createDatabase({ id: "new database" });
            const collectionRequestOptions = { offerThroughput };
            let collectionDefinition: any = "";
            if (isPartitionedCollection) {
                collectionDefinition = {
                    id: Base.generateGuidId(),
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
                            "/id",
                        ],
                        kind: "Hash",
                    },
                };
            } else {
                collectionDefinition = { id: "sample collection" };
            }
            const { result: createdCollection } = await client.createCollection(
                TestHelpers.getDatabaseLink(isNameBased, db), collectionDefinition, collectionRequestOptions);

            const { result: collection, headers } = await client.readCollection(
                TestHelpers.getCollectionLink(isNameBased, db, createdCollection), { populateQuotaInfo: true });

            // Validate the collection size quota
            assert.notEqual(headers[Constants.HttpHeaders.MaxResourceQuota], null);
            assert.notEqual(headers[Constants.HttpHeaders.MaxResourceQuota], "");
            const collectionSize: number = Number((headers[Constants.HttpHeaders.MaxResourceQuota] as string).split(";")
                .reduce((map: any, obj: string) => {
                    const items = obj.split("=");
                    map[items[0]] = items[1];
                    return map;
                }, {})[Constants.Quota.CollectionSize]);
            assert.equal(collectionSize, expectedCollectionSize, "Collection size is unexpected");

            const { result: offers } = await client.readOffers({}).toArray();
            assert.equal(offers.length, 1);
            const expectedOffer = offers[0];
            assert.equal(expectedOffer.content.offerThroughput, collectionRequestOptions.offerThroughput, "Expected offerThroughput to be " + collectionRequestOptions.offerThroughput);
            validateOfferResponseBody(expectedOffer, collection._self, undefined);
            // Read the offer
            const { result: readOffer } = await client.readOffer(expectedOffer._self);
            validateOfferResponseBody(readOffer, collection._self, undefined);
            // Check if the read offer is what we expected.
            assert.equal(expectedOffer.id, readOffer.id);
            assert.equal(expectedOffer._rid, readOffer._rid);
            assert.equal(expectedOffer._self, readOffer._self);
            assert.equal(expectedOffer.resource, readOffer.resource);
            // Read offer with a bad offer link.
            try {
                const badLink = expectedOffer._self.substring(0, expectedOffer._self.length - 1) + "x/";
                await client.readOffer(badLink);
                assert.fail("Must throw after read with bad offer");
            } catch (err) {
                const notFoundErrorCode = 400;
                assert.equal(err.code, notFoundErrorCode, "response should return error code 404");
            }
            // Query for offer.
            const querySpec = {
                query: "select * FROM root r WHERE r.id=@id",
                parameters: [
                    {
                        name: "@id",
                        value: expectedOffer.id,
                    },
                ],
            };
            const { result: offers2 } = await client.queryOffers(querySpec).toArray();
            assert.equal(offers2.length, 1);
            const oneOffer = offers2[0];
            validateOfferResponseBody(oneOffer, collection._self, undefined);
            // Now delete the collection.
            await client.deleteCollection(
                TestHelpers.getCollectionLink(isNameBased, db, collection));
            // read offer after deleting collection.
            try {
                await client.readOffer(expectedOffer._self);
                assert.fail("Must throw after delete");
            } catch (err) {
                const notFoundErrorCode = 404;
                assert.equal(err.code, notFoundErrorCode, "response should return error code 404");
            }
        };

        const mbInBytes = 1024 * 1024;
        const offerThroughputSinglePartitionCollection = 5000;
        const minOfferThroughputPCollectionWithMultiPartitions = 2000;
        const maxOfferThroughputPCollectionWithSinglePartition = minOfferThroughputPCollectionWithMultiPartitions - 100;

        it.skip("nativeApi Should do offer read and query operations successfully name based single partition collection", async function () {
            try {
                await offerReadAndQueryTest(true, false, offerThroughputSinglePartitionCollection, mbInBytes);
            } catch (err) {
                throw err;
            }
        });

        it.skip("nativeApi Should do offer read and query operations successfully rid based single partition collection", async function () {
            try {
                await offerReadAndQueryTest(false, false, offerThroughputSinglePartitionCollection, mbInBytes);
            } catch (err) {
                throw err;
            }
        });

        it.skip("nativeApi Should do offer read and query operations successfully w/ name based p-Collection w/ 1 partition", async function () {
            try {
                await offerReadAndQueryTest(true, true, maxOfferThroughputPCollectionWithSinglePartition, mbInBytes);
            } catch (err) {
                throw err;
            }
        });

        it.skip("nativeApi Should do offer read and query operations successfully w/ rid based p-Collection w/ 1 partition", async function () {
            try {
                await offerReadAndQueryTest(false, true, maxOfferThroughputPCollectionWithSinglePartition, mbInBytes);
            } catch (err) {
                throw err;
            }
        });

        it.skip("nativeApi Should do offer read and query operations successfully w/ name based p-Collection w/ multi partitions", async function () {
            try {
                await offerReadAndQueryTest(true, true, minOfferThroughputPCollectionWithMultiPartitions, 5 * mbInBytes);
            } catch (err) {
                throw err;
            }
        });

        it.skip("nativeApi Should do offer read and query operations successfully w/ rid based p-Collection w/ multi partitions", async function () {
            try {
                await offerReadAndQueryTest(false, true, minOfferThroughputPCollectionWithMultiPartitions, 5 * mbInBytes);
            } catch (err) {
                throw err;
            }
        });

        const offerReplaceTest = async function (isNameBased: boolean) {
            try {
                const client = new CosmosClient(host, { masterKey });
                // create database
                const { result: db } = await client.createDatabase({ id: "sample database" });
                // create collection
                const { result: collection } = await client.createCollection(
                    TestHelpers.getDatabaseLink(isNameBased, db), { id: "sample collection" });
                const { result: offers } = await client.readOffers().toArray();
                assert.equal(offers.length, 1);
                const expectedOffer = offers[0];
                validateOfferResponseBody(expectedOffer, collection._self, undefined);
                // Replace the offer.
                const offerToReplace = Base.extend({}, expectedOffer);
                const oldThroughput = offerToReplace.content.offerThroughput;
                offerToReplace.content.offerThroughput = oldThroughput + 100;
                const { result: replacedOffer } = await client.replaceOffer(offerToReplace._self, offerToReplace);
                validateOfferResponseBody(replacedOffer, collection._self, undefined);
                // Check if the replaced offer is what we expect.
                assert.equal(replacedOffer.id, offerToReplace.id);
                assert.equal(replacedOffer._rid, offerToReplace._rid);
                assert.equal(replacedOffer._self, offerToReplace._self);
                assert.equal(replacedOffer.resource, offerToReplace.resource);
                assert.equal(replacedOffer.content.offerThroughput, offerToReplace.content.offerThroughput);
                // Replace an offer with a bad id.
                try {
                    const offerBadId = Base.extend({}, offerToReplace);
                    offerBadId._rid = "NotAllowed";
                    await client.replaceOffer(offerBadId._self, offerBadId);
                    assert.fail("Must throw after replace with bad id");
                } catch (err) {
                    const badRequestErrorCode = 400;
                    assert.equal(err.code, badRequestErrorCode);
                }
                // Replace an offer with a bad rid.
                try {
                    const offerBadRid = Base.extend({}, offerToReplace);
                    offerBadRid._rid = "InvalidRid";
                    await client.replaceOffer(offerBadRid._self, offerBadRid);
                    assert.fail("Must throw after replace with bad rid");
                } catch (err) {
                    const badRequestErrorCode = 400;
                    assert.equal(err.code, badRequestErrorCode);
                }
                // Replace an offer with null id and rid.
                try {
                    const offerNullId = Base.extend({}, offerToReplace);
                    offerNullId.id = undefined;
                    offerNullId._rid = undefined;
                    await client.replaceOffer(offerNullId._self, offerNullId);
                    assert.fail("Must throw after repalce with null id and rid");
                } catch (err) {
                    const badRequestErrorCode = 400;
                    assert.equal(err.code, badRequestErrorCode);
                }
            } catch (err) {
                throw err;
            }
        };

        it("nativeApi Should do offer replace operations successfully name based", async function () {
            try {
                await offerReplaceTest(true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do offer replace operations successfully rid based", async function () {
            try {
                await offerReplaceTest(false);
            } catch (err) {
                throw err;
            }
        });

        const createCollectionWithOfferTypeTest = async function (isNameBased: boolean) {
            try {
                const client = new CosmosClient(host, { masterKey });
                // create database
                const { result: db } = await client.createDatabase({ id: "sample database" });
                // create collection
                const { result: collection } = await client.createCollection(
                    TestHelpers.getDatabaseLink(isNameBased, db), { id: "sample collection" }, { offerType: "S2" });
                const { result: offers } = await client.readOffers().toArray();
                assert.equal(offers.length, 1);
                const expectedOffer = offers[0];
                assert.equal(expectedOffer.offerType, "S2");
            } catch (err) {
                throw err;
            }
        };

        it("nativeApi Should create collection with specified offer type successfully name based", async function () {
            try {
                await createCollectionWithOfferTypeTest(true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should create collection with specified offer type successfully rid based", async function () {
            try {
                await createCollectionWithOfferTypeTest(false);
            } catch (err) {
                throw err;
            }
        });
    });

    describe("validate database account functionality", function () {
        const databaseAccountTest = async function (isNameBased: boolean) {
            try {
                const client = new CosmosClient(host, { masterKey });
                const { result: databaseAccount, headers } = await client.getDatabaseAccount();
                assert.equal(databaseAccount.DatabasesLink, "/dbs/");
                assert.equal(databaseAccount.MediaLink, "/media/");
                assert.equal(databaseAccount.MaxMediaStorageUsageInMB, headers["x-ms-max-media-storage-usage-mb"]); // TODO: should use constants here
                assert.equal(databaseAccount.CurrentMediaStorageUsageInMB, headers["x-ms-media-storage-usage-mb"]);
                assert(databaseAccount.ConsistencyPolicy !== undefined);
            } catch (err) {
                throw err;
            }
        };

        it("nativeApi Should get database account successfully name based", async function () {
            try {
                await databaseAccountTest(true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should get database account successfully rid based", async function () {
            try {
                await databaseAccountTest(false);
            } catch (err) {
                throw err;
            }
        });
    });

    describe("Validate response headers", function () {
        const createThenReadCollection = async function (isNameBased: boolean, client: CosmosClient, db: any, body: any) {
            const { result: createdCollection, headers } = await client.createCollection(
                TestHelpers.getDatabaseLink(isNameBased, db), body);
            const response = await client.readCollection(
                TestHelpers.getCollectionLink(isNameBased, db, createdCollection));
            return response;
        };

        const indexProgressHeadersTest = async function (isNameBased: boolean) {
            const client = new CosmosClient(host, { masterKey });
            const { result: db } = await client.createDatabase({ id: "sample database" });
            const { headers: headers1 } = await createThenReadCollection(isNameBased, client, db, { id: "consistent_coll" });
            assert.notEqual(headers1[Constants.HttpHeaders.IndexTransformationProgress], undefined);
            assert.equal(headers1[Constants.HttpHeaders.LazyIndexingProgress], undefined);

            const lazyCollectionDefinition = {
                id: "lazy_coll",
                indexingPolicy: { indexingMode: DocumentBase.IndexingMode.Lazy },
            };
            const { headers: headers2 } = await createThenReadCollection(isNameBased, client, db, lazyCollectionDefinition);
            assert.notEqual(headers2[Constants.HttpHeaders.IndexTransformationProgress], undefined);
            assert.notEqual(headers2[Constants.HttpHeaders.LazyIndexingProgress], undefined);

            const noneCollectionDefinition = {
                id: "none_coll",
                indexingPolicy: { indexingMode: DocumentBase.IndexingMode.None, automatic: false },
            };
            const { headers: headers3 } = await createThenReadCollection(isNameBased, client, db, noneCollectionDefinition);
            assert.notEqual(headers3[Constants.HttpHeaders.IndexTransformationProgress], undefined);
            assert.equal(headers3[Constants.HttpHeaders.LazyIndexingProgress], undefined);
        };

        it("nativeApi Validate index progress headers name based", async function () {
            try {
                await indexProgressHeadersTest(true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Validate index progress headers rid based", async function () {
            try {
                await indexProgressHeadersTest(false);
            } catch (err) {
                throw err;
            }
        });
    });

    describe("Validate Id validation", function () {
        it("nativeApi Should fail on illegal Ids.", async function () {
            const client = new CosmosClient(host, { masterKey });
            // Id shoudn't end with a space.
            try {
                const { result: db } = await client.createDatabase({ id: "id_ends_with_space " });
                assert.fail("Must throw if id ends with a space");
            } catch (err) {
                assert.equal("Id ends with a space.", err.message);
            }

            // Id shoudn't contain "/".
            try {
                const { result: db } = await client.createDatabase({ id: "id_with_illegal/_char" });
                assert.fail("Must throw if id has illegal characters");
            } catch (err) {
                assert.equal("Id contains illegal chars.", err.message);
            }

            // Id shoudn't contain "\\".
            try {
                const { result: db } = await client.createDatabase({ id: "id_with_illegal\\_char" });
                assert.fail("Must throw if id contains illegal characters");
            } catch (err) {
                assert.equal("Id contains illegal chars.", err.message);
            }

            // Id shoudn't contain "?".
            try {
                const { result: db } = await client.createDatabase({ id: "id_with_illegal?_?char" });
                assert.fail("Must throw if id contains illegal characters");
            } catch (err) {
                assert.equal("Id contains illegal chars.", err.message);
            }

            // Id shoudn't contain "#".
            try {
                const { result: db } = await client.createDatabase({ id: "id_with_illegal#_char" });
                assert.fail("Must throw if id contains illegal characters");
            } catch (err) {
                assert.equal("Id contains illegal chars.", err.message);
            }
        });
    });

    describe("TTL tests", function () {
        this.timeout(60000);

        async function sleep(time: number) {
            return new Promise((resolve, reject) => {
                setTimeout(resolve, time);
            });
        }

        async function createCollectionWithInvalidDefaultTtl(client: CosmosClient, db: any, collectionDefinition: any, collId: any, defaultTtl: number) {
            collectionDefinition.id = collId;
            collectionDefinition.defaultTtl = defaultTtl;
            try {
                await client.createCollection(db._self, collectionDefinition);
            } catch (err) {
                const badRequestErrorCode = 400;
                assert.equal(err.code, badRequestErrorCode, "response should return error code " + badRequestErrorCode);
            }
        }

        async function createDocumentWithInvalidTtl(client: CosmosClient, collection: any, documentDefinition: any, docId: any, ttl: number) {
            documentDefinition.id = docId;
            documentDefinition.ttl = ttl;

            try {
                await client.createDocument(collection._self, documentDefinition);
                assert.fail("Must throw if using invalid TTL");
            } catch (err) {
                const badRequestErrorCode = 400;
                assert.equal(err.code, badRequestErrorCode, "response should return error code " + badRequestErrorCode);
            }
        }

        it("nativeApi Validate Collection and Document TTL values.", async function () {
            const client = new CosmosClient(host, { masterKey });

            const { result: db } = await client.createDatabase({ id: "sample database" });

            const collectionDefinition = {
                id: "sample collection1",
                defaultTtl: 5,
            };

            const { result: collection } = await client.createCollection(db._self, collectionDefinition);
            assert.equal(collectionDefinition.defaultTtl, collection.defaultTtl);

            // null, 0, -10 are unsupported value for defaultTtl.Valid values are -1 or a non-zero positive 32-bit integer value
            await createCollectionWithInvalidDefaultTtl(client, db, collectionDefinition, "sample collection2", null);
            await createCollectionWithInvalidDefaultTtl(client, db, collectionDefinition, "sample collection3", 0);
            await createCollectionWithInvalidDefaultTtl(client, db, collectionDefinition, "sample collection4", -10);

            const documentDefinition = {
                id: "doc",
                name: "sample document",
                key: "value",
                ttl: 2,
            };

            // 0, null, -10 are unsupported value for ttl.Valid values are -1 or a non-zero positive 32-bit integer value
            await createDocumentWithInvalidTtl(client, collection, documentDefinition, "doc1", 0);
            await createDocumentWithInvalidTtl(client, collection, documentDefinition, "doc2", null);
            await createDocumentWithInvalidTtl(client, collection, documentDefinition, "doc3", -10);
        });

        async function checkDocumentGone(client: CosmosClient, collection: any, createdDocument: any) {
            try {
                await client.readDocument(createdDocument._self);
                assert.fail("Must throw if the document isn't there");
            } catch (err) {
                const badRequestErrorCode = 404;
                assert.equal(err.code, badRequestErrorCode, "response should return error code " + badRequestErrorCode);
            }
        }

        async function checkDocumentExists(client: CosmosClient, collection: any, createdDocument: any) {
            try {
                const { result: readDocument } = await client.readDocument(createdDocument._self);
                assert.equal(readDocument.ttl, createdDocument.ttl);
            } catch (err) {
                throw err;
            }
        }

        async function positiveDefaultTtlStep4(client: CosmosClient, collection: any, createdDocument: any) {
            // the created document should NOT be gone as it 's ttl value is set to 8 which overrides the collections' s defaultTtl value(5)
            try {
                await checkDocumentExists(client, collection, createdDocument);
                await sleep(4000);
                await checkDocumentGone(client, collection, createdDocument);
            } catch (err) {
                throw err;
            }
        }

        async function positiveDefaultTtlStep3(client: CosmosClient, collection: any, createdDocument: any, documentDefinition: any) {
            // the created document should be gone now as it 's ttl value is set to 2 which overrides the collections' s defaultTtl value(5)
            try {
                await checkDocumentGone(client, collection, createdDocument);
                documentDefinition.id = "doc4";
                documentDefinition.ttl = 8;

                const { result: doc } = await client.createDocument(collection._self, documentDefinition);
                await sleep(6000);
                await positiveDefaultTtlStep4(client, collection, doc);
            } catch (err) {
                throw err;
            }
        }

        async function positiveDefaultTtlStep2(client: CosmosClient, collection: any, createdDocument: any, documentDefinition: any) {
            // the created document should NOT be gone as it 's ttl value is set to -1(never expire) which overrides the collections' s defaultTtl value
            try {
                await checkDocumentExists(client, collection, createdDocument);
                documentDefinition.id = "doc3";
                documentDefinition.ttl = 2;

                const { result: doc } = await client.createDocument(collection._self, documentDefinition);
                await sleep(4000);
                await positiveDefaultTtlStep3(client, collection, doc, documentDefinition);
            } catch (err) {
                throw err;
            }
        }

        async function positiveDefaultTtlStep1(client: CosmosClient, collection: any, createdDocument: any, documentDefinition: any) {
            try {
                // the created document should be gone now as it 's ttl value would be same as defaultTtl value of the collection
                await checkDocumentGone(client, collection, createdDocument);
                documentDefinition.id = "doc2";
                documentDefinition.ttl = -1;

                const { result: doc } = await client.createDocument(collection._self, documentDefinition);
                await sleep(5000);
                await positiveDefaultTtlStep2(client, collection, createdDocument, documentDefinition);
            } catch (err) {
                throw err;
            }
        }

        it("nativeApi Validate Document TTL with positive defaultTtl.", async function () {
            try {
                const client = new CosmosClient(host, { masterKey });

                const { result: db } = await client.createDatabase({ id: "sample database" });

                const collectionDefinition = {
                    id: "sample collection",
                    defaultTtl: 5,
                };

                const { result: collection } = await client.createCollection(db._self, collectionDefinition);

                const documentDefinition = {
                    id: "doc1",
                    name: "sample document",
                    key: "value",
                };

                const { result: createdDocument } = await client.createDocument(collection._self, documentDefinition);
                await sleep(7000);
                await positiveDefaultTtlStep1(client, collection, createdDocument, documentDefinition);
            } catch (err) {
                throw err;
            }
        });

        async function minusOneDefaultTtlStep1(client: CosmosClient, collection: any, createdDocument1: any, createdDocument2: any, createdDocument3: any) {
            try {
                // the created document should be gone now as it 's ttl value is set to 2 which overrides the collections' s defaultTtl value(-1)
                await checkDocumentGone(client, collection, createdDocument3);

                // The documents with id doc1 and doc2 will never expire
                const { result: readDocument1 } = await client.readDocument(createdDocument1._self);
                assert.equal(readDocument1.id, createdDocument1.id);

                const { result: readDocument2 } = await client.readDocument(createdDocument2._self);
                assert.equal(readDocument2.id, createdDocument2.id);
            } catch (err) {
                throw err;
            }
        }

        it("nativeApi Validate Document TTL with -1 defaultTtl.", async function () {
            try {
                const client = new CosmosClient(host, { masterKey });

                const { result: db } = await client.createDatabase({ id: "sample database" });

                const collectionDefinition = {
                    id: "sample collection",
                    defaultTtl: -1,
                };

                const { result: collection } = await client.createCollection(db._self, collectionDefinition);

                const documentDefinition: any = {
                    id: "doc1",
                    name: "sample document",
                    key: "value",
                };

                // the created document 's ttl value would be -1 inherited from the collection' s defaultTtl and this document will never expire
                const { result: createdDocument1 } = await client.createDocument(collection._self, documentDefinition);

                // This document is also set to never expire explicitly
                documentDefinition.id = "doc2";
                documentDefinition.ttl = -1;

                const { result: createdDocument2 } = await client.createDocument(collection._self, documentDefinition);

                documentDefinition.id = "doc3";
                documentDefinition.ttl = 2;

                const { result: createdDocument3 } = await client.createDocument(collection._self, documentDefinition);
                await sleep(4000);
                await minusOneDefaultTtlStep1(client, collection, createdDocument1, createdDocument2, createdDocument3);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Validate Document TTL with no defaultTtl.", async function () {
            try {
                const client = new CosmosClient(host, { masterKey });

                const { result: db } = await client.createDatabase({ id: "sample database" });

                const collectionDefinition = { id: "sample collection" };

                const { result: collection } = await client.createCollection(db._self, collectionDefinition);

                const documentDefinition = {
                    id: "doc1",
                    name: "sample document",
                    key: "value",
                    ttl: 5,
                };

                const { result: createdDocument } = await client.createDocument(collection._self, documentDefinition);

                // Created document still exists even after ttl time has passed since the TTL is disabled at collection level(no defaultTtl property defined)
                await sleep(7000);
                await checkDocumentExists(client, collection, createdDocument);
            } catch (err) {
                throw err;
            }
        });

        async function miscCasesStep4(client: CosmosClient, collection: any, createdDocument: any, documentDefinition: any) {
            // Created document still exists even after ttl time has passed since the TTL is disabled at collection level
            try {
                await checkDocumentExists(client, collection, createdDocument);
            } catch (err) {
                throw err;
            }
        }

        async function miscCasesStep3(client: CosmosClient, collection: any, upsertedDocument: any, documentDefinition: any) {
            // the upserted document should be gone now after 10 secs from the last write(upsert) of the document
            try {
                await checkDocumentGone(client, collection, upsertedDocument);
                const query = "SELECT * FROM root r";
                const { result: results } = await client.queryDocuments(collection._self, query).toArray();
                assert.equal(results.length, 0);

                // Use a collection definition without defaultTtl to disable ttl at collection level
                const collectionDefinition = { id: collection.id };

                const { result: replacedCollection } = await client.replaceCollection(collection._self, collectionDefinition);

                documentDefinition.id = "doc2";

                const { result: createdDocument } = await client.createDocument(replacedCollection._self, documentDefinition);
                await sleep(5000);
                await miscCasesStep4(client, replacedCollection, createdDocument, documentDefinition);
            } catch (err) {
                throw err;
            }
        }

        async function miscCasesStep2(client: CosmosClient, collection: any, documentDefinition: any) {
            // Upsert the document after 3 secs to reset the document 's ttl
            try {
                documentDefinition.key = "value2";
                const { result: upsertedDocument } = await client.upsertDocument(collection._self, documentDefinition);
                await sleep(7000);
                // Upserted document still exists after (3+7)10 secs from document creation time( with collection 's defaultTtl set to 8) since it' s ttl was reset after 3 secs by upserting it
                await checkDocumentExists(client, collection, upsertedDocument);
                await sleep(3000);
                await miscCasesStep3(client, collection, upsertedDocument, documentDefinition);
            } catch (err) {
                throw err;
            }
        }

        async function miscCasesStep1(client: CosmosClient, collection: any, createdDocument: any, documentDefinition: any) {
            try {
                // the created document should be gone now as the ttl time expired
                await checkDocumentGone(client, collection, createdDocument);
                // We can create a document with the same id after the ttl time has expired
                const { result: doc } = await client.createDocument(collection._self, documentDefinition);
                assert.equal(documentDefinition.id, doc.id);
                await sleep(3000);
                miscCasesStep2(client, collection, documentDefinition);
            } catch (err) {
                throw err;
            }
        }

        it("nativeApi Validate Document TTL Misc cases.", async function () {
            try {
                const client = new CosmosClient(host, { masterKey });

                const { result: db } = await client.createDatabase({ id: "sample database" });

                const collectionDefinition = {
                    id: "sample collection",
                    defaultTtl: 8,
                };

                const { result: collection } = await client.createCollection(db._self, collectionDefinition);

                const documentDefinition = {
                    id: "doc1",
                    name: "sample document",
                    key: "value",
                };

                const { result: createdDocument } = await client.createDocument(collection._self, documentDefinition);

                await sleep(10000);
                await miscCasesStep1(client, collection, createdDocument, documentDefinition);
            } catch (err) {
                throw err;
            }
        });
    });

    describe("HashPartitionResolver", function () {

        const test = async function (useUpsert: boolean) {
            try {
                const client = new CosmosClient(host, { masterKey });
                const getPartitionResolver = function (collectionLink1: any, collectionLink2: any) {
                    return new HashPartitionResolver("id", [collectionLink1, collectionLink2]);
                };
                const querySpec = {
                    query: "SELECT * FROM root",
                };

                const { result: db } = await client.createDatabase({ id: "database" });
                const { result: collection1 } = await client.createCollection(db._self, { id: "sample coll 1" });
                const { result: collection2 } = await client.createCollection(db._self, { id: "sample coll 2" });
                const resolver = getPartitionResolver(collection1._self, collection2._self);
                client.partitionResolvers["foo"] = resolver;

                const { result: doc1 } = await client.createDocument("foo", { id: "sample doc 1" });
                const { result: doc2 } = await client.createDocument("foo", { id: "sample doc 2" });
                const { result: doc3 } = await client.createDocument("foo", { id: "sample doc 11" });
                const { result: docs1 } = await client.queryDocuments(
                    "foo", querySpec/*, { resolverPartitionKey: resolver.getPartitionKey(doc1) }*/).toArray();
                const d1 = docs1.filter(function (d) { return (d.id === doc1.id); });
                assert(d1, "doc1 not found");
                assert.strictEqual(d1.length, 1);
                const { result: docs2 } = await client.queryDocuments(
                    "foo", querySpec/*, { resolverPartitionKey: resolver.getPartitionKey(doc2) }*/).toArray(); // TODO: I don't think this setting actually does anything
                const d2 = docs2.filter(function (d) { return (d.id === doc2.id); });
                assert(d2, "doc2 not found");
                assert.strictEqual(d2.length, 1);
                const { result: docs3 } = await client.queryDocuments(
                    "foo", querySpec/*, { resolverPartitionKey: resolver.getPartitionKey(doc3) }*/).toArray();
                const d3 = docs3.filter(function (d) { return (d.id === doc3.id); });
                assert(d3, "doc3 not found");
                assert.strictEqual(d3.length, 1);
            } catch (err) {
                throw err;
            }
        };

        it("CRUD operations", async function () {
            try {
                await test(false);
            } catch (err) {
                throw err;
            }
        });
        it("CRUD operations with upsert", async function () {
            try {
                await test(true);
            } catch (err) {
                throw err;
            }
        });
    });
});
