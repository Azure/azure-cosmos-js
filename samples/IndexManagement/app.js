// @ts-check

console.log();
console.log("Azure CosmosDB Node.js Samples");
console.log("================================");
console.log();
console.log("INDEX MANAGEMENT");
console.log("================");
console.log();

const cosmos = require("../../lib/");
const CosmosClient = cosmos.CosmosClient;
const config = require("../Shared/config");
const fs = require("fs");
const databaseId = config.names.database;
const containerId = config.names.container;

const endpoint = config.connection.endpoint;
const masterKey = config.connection.authKey;

// Establish a new instance of the DocumentDBClient to be used throughout this demo
const client = new CosmosClient({ endpoint, auth: { masterKey } });

//IMPORTANT:
//this sample creates and delete containers at least 7 times.
//each time you execute createCollection you are charged for 1hr (our smallest billing unit)
//even if that collection is only alive for a few seconds.
//so please take note of this before running this sample

//TODO: Now that index transforms exist, refactor to create only 1 collection and just reuse each time

//NOTE:
//when using the new IDBased Routing URIs, instead of the _self, as we 're doing in this sample
//ensure that the URI does not end with a trailing '/' character
//so dbs/databaseId instead of dbs/databaseId/
//also, ensure there is no leading space

//-----------------------------------------------------------------------------------------------------------
// This demo performs a few steps
// 1. explictlyExcludeFromIndex - how to manually exclude a document from being indexed
// 2. useManualIndexing         - switch auto indexing off, and then manually add individual docs
// 3. useLazyIndexing           - create a collection with indexing mode set to Lazy instead of consistent
// 4. forceScanOnHashIndexPath  - use a directive to allow a scan on a string path during a range operation
// 5. useRangeIndexOnStrings    - create a range index on string path
// 6. excludePathsFromIndex     - create a custom indexPolicy that excludes specific path in document
// 7. performIndexTransforms    - create a collection with default indexPolicy, then update this online
//------------------------------------------------------------------------------------------------------------
async function run() {
  // Gets a database for us to work with
  const { database } = await init();
  //1.
  console.log("\n1.");
  console.log("explictlyExcludeFromIndex - manually exclude document from being indexed");
  await explictlyExcludeFromIndex(database);
  //2.
  console.log("\n2.");
  console.log("useManualIndexing - switch auto indexing off, and manually index docs");
  await useManualIndexing(database);
  //3.
  console.log("\n3.");
  console.log("useLazyIndexing - create collection lazy index");
  await useLazyIndexing(database);
  //4.
  console.log("\n4.");
  console.log("forceScanOnHashIndexPath  - use index directive to allow range scan on path without range index");
  await forceScanOnHashIndexPath(database);
  //5.
  console.log("\n5.");
  console.log("useRangeIndexOnStrings  - create a range index on string path");
  await useRangeIndexOnStrings(database);
  //6.
  console.log("\n6.");
  console.log("excludePathsFromIndex  - create a range index on string path");
  await excludePathsFromIndex(database);
  //7.
  console.log("\n7.");
  console.log("performIndexTransforms  - update an index policy online");
  await performIndexTransforms(database);
  await finish();
}

async function init(callback) {
  return client.databases.createIfNotExists({ id: databaseId });
}

/**
 *
 * @param {cosmos.Database} database
 */
async function explictlyExcludeFromIndex(database) {
  console.log("create collection with default index policy");

  //we're using the default indexing policy because by default indexingMode == consistent & automatic == true
  //which means that by default all documents added to a collection are indexed as the document is written
  const collId = "ExplictExcludeDemo";
  const { body: coll, container } = await database.containers.create({ id: collId });
  const docSpec = { id: "doc", foo: "bar" };

  console.log("Create document, but exclude from index");

  //createDocument takes RequestOptions as 3rd parameter.
  //One of these options is indexingDirectives which can be include, or exclude
  //we're using exclude this time to manually exclude this document from being indexed
  const { body: document, item } = await container.items.create(docSpec, { indexingDirective: "exclude" });
  console.log("Document with id '" + document.id + "' created");

  const querySpec = {
    query: "SELECT * FROM root r WHERE r.foo=@foo",
    parameters: [
      {
        name: "@foo",
        value: "bar"
      }
    ]
  };

  console.log("queryDocuments for doc should not find any results");
  const { result: results } = await container.items.query(querySpec).toArray();
  if (results.length !== 0) {
    throw new Error("there were not meant to be results");
  }
  console.log("No results found");

  console.log("readDocument should still find the doc");

  const { body: doc } = await item.read();
  console.log("readDocument found doc and its _self is '" + doc._self + "'");

  await container.delete();
  console.log("Collection '" + collId + "' deleted");
}

/**
 *
 * @param {cosmos.Database} database
 */
async function useManualIndexing(database) {
  console.log("create collection with indexingPolicy.automatic : false");

  const collId = "ManualIndexDemo";
  const indexingPolicySpec = { automatic: false };

  const { container } = await database.containers.create({
    id: collId,
    indexingPolicy: indexingPolicySpec
  });

  //documentClient.createDocument() takes RequestOptions as 3rd parameter.
  //One of these options is indexingDirectives which can be include, or exclude
  //we're using include this time to manually index this particular document
  console.log("Create document, and explicitly include in index");
  const docSpec = { id: "doc", foo: "bar" };
  const { body: document } = await container.items.create(docSpec, { indexingDirective: "include" });
  console.log("Document with id '" + document.id + "' created");

  const querySpec = {
    query: "SELECT * FROM root r WHERE r.foo=@foo",
    parameters: [
      {
        name: "@foo",
        value: "bar"
      }
    ]
  };

  console.log("queryDocuments for doc should find a result as it was indexed");
  const { result: results } = await container.items.query(querySpec).toArray();
  if (results.length === 0) {
    throw new Error("There were meant to be results");
  } else {
    const doc = results[0];
    console.log("Document with id '" + doc.id + "' found");

    await container.delete();
    console.log("Collection '" + collId + "' deleted");
  }
}

/**
 *
 * @param {cosmos.Database} database
 */
async function useLazyIndexing(database) {
  // Azure Cosmos DB offers synchronous (consistent) and asynchronous (lazy) index updates.
  // By default, the index is updated synchronously on each insert, replace or delete of a document to the collection.
  // There are times when you might want to configure certain collections to update their index asynchronously.
  // Lazy indexing boosts the write performance and lowers RU charge of each insert
  // and is ideal for bulk ingestion scenarios for primarily read-heavy collections
  // It is important to note that you might get inconsistent reads whilst the writes are in progress,
  // However once the write volume tapers off and the index catches up, then the reads continue as normal

  // It is difficult to demonstrate this is a code sample as you only really notice this under sustained
  // heavy-write workloads. So this code sample shows just how to create the custom index polixy needed

  console.log("create container with indexingPolicy.indexMode : lazy");

  // allowed values for IndexingMode are consistent (default), lazy and none
  const containerId = "LazyIndexDemo";
  const indexingPolicySpec = { indexingMode: cosmos.DocumentBase.IndexingMode.Lazy };

  const { body: containerDef, container } = await database.containers.create({
    id: containerId,
    indexingPolicy: indexingPolicySpec
  });
  console.log("Collection '" + containerDef.id + "' created with index policy: ");
  console.log(containerDef.indexingPolicy);

  await container.delete();
  console.log("Collection '" + containerId + "' deleted");
}
/**
 *
 * @param {cosmos.Database} database
 */
async function forceScanOnHashIndexPath(database) {
  // Azure Cosmos DB index knows about 3 datatypes - numbers, strings and geojson
  // By default, the index on a collection does not put range indexes on to string paths
  // Therefore, if you try and do a range operation on a string path with a default index policy, you will get an error
  // You can override this by using an request option, that is what this demonstrates
  // NOTE - it is not recommended to do this often due to the high charge associated with a full collection scan
  //        if you find yourself doing this often on a particular path, create a range index for strings on that path

  console.log("create container with default index policy");
  const containerId = "ForceScanDemo";

  const { body: containerDef, container } = await database.containers.create({ id: containerId });
  console.log("Collection '" + containerDef.id + "' created with default index policy (i.e. no range on strings)");

  //create a document
  console.log("Creating document");
  await container.items.create({ id: "doc", stringField: "a string value" });
  console.log("Document created");

  //try a range query on the document, expect an error
  const querySpec = {
    query: "SELECT * FROM root r WHERE r.stringField > @value",
    parameters: [
      {
        name: "@value",
        value: "a"
      }
    ]
  };

  console.log("Querying for document where stringField > 'a', should fail");
  try {
    await container.items.query(querySpec).toArray();
  } catch (err) {
    console.log("Query failed with " + err.code);
  }
  //try same range query again, this time specifying the directive to do a scan,
  //be wary of high RU cost that you could get for even a single document!
  //we won't particularly see a high charge this time because there is only 1 doc in the collection
  //so a scan on 1 document isn't costly. a few thousand documents will be very different
  console.log("Repeating query for document where stringField > 'a', this time with enableScanInQuery: true");

  //notice how we're switching to queryIterator.executeNext instead of calling .toArray() as before
  //reason being, toArray will issue multiple requests to the server until it has fetched all results
  //here we can control this using executeNext.
  //now we can get the headers for each request which includes the charge, continuation tokens etc.

  const queryIterator = container.items.query(querySpec, { enableScanInQuery: true });
  const { result: docs, headers } = await queryIterator.executeNext();
  const charge = headers["x-ms-request-charge"];
  const doc = docs[0];

  console.log("Document '" + doc.id + "' found, request charge: " + charge);

  await container.delete();
  console.log("Collection '" + containerId + "' deleted");
}

/**
 *
 * @param {cosmos.Database} database
 */
async function useRangeIndexOnStrings(database) {
  // Azure Cosmos DB index knows about 3 datatypes - numbers, strings and geojson
  // By default, the index on a collection does not put range indexes on to string paths
  // In this demo we are going to create a custom index policy which enables range index on a string path

  console.log("create collection with range index on string paths");
  const collId = "RangeIndexDemo";
  /**
   * @type cosmos.DocumentBase.IndexingPolicy
   */
  const indexPolicySpec = {
    includedPaths: [
      {
        path: "/*",
        indexes: [
          {
            kind: cosmos.DocumentBase.IndexKind.Range,
            dataType: cosmos.DocumentBase.DataType.String
          },
          {
            kind: cosmos.DocumentBase.IndexKind.Range,
            dataType: cosmos.DocumentBase.DataType.Number
          }
        ]
      }
    ]
  };

  const { body: coll, container } = await database.containers.create({ id: collId, indexingPolicy: indexPolicySpec });
  console.log("Collection '" + coll.id + "' created with custom index policy");

  //create a document
  console.log("Creating document");
  container.items.create({ id: "doc", stringField: "a string value" });
  console.log("Document created");

  //try a range query on the document, expect an error
  const querySpec = {
    query: "SELECT * FROM root r WHERE r.stringField > @value",
    parameters: [
      {
        name: "@value",
        value: "a"
      }
    ]
  };

  console.log("Querying for document where stringField > 'a', should return results");

  //notice how we're switching to queryIterator.executeNext instead of calling .toArray() as before
  //reason being, toArray will issue multiple requests to the server until it has fetched all results
  //here we can control this using executeNext.
  //now we can get the headers for each request which includes the charge, continuation tokens etc.
  const queryIterator = container.items.query(querySpec, { enableScanInQuery: true });
  const { result: docs, headers } = await queryIterator.executeNext();
  const charge = headers["x-ms-request-charge"];
  const doc = docs[0];

  console.log("Document '" + doc.id + "' found, request charge: " + charge);

  await container.delete();
  console.log("Collection '" + collId + "' deleted");
}

/**
 *
 * @param {cosmos.Database} database
 */
async function excludePathsFromIndex(database) {
  console.log("create collection with an excluded path");
  const collId = "ExcludePathDemo";
  const indexPolicySpec = {
    //the special "/" must always be included somewhere. in this case we're including root
    //and then excluding specific paths
    includedPaths: [
      {
        path: "/",
        indexes: [
          {
            kind: cosmos.DocumentBase.IndexKind.Hash,
            dataType: cosmos.DocumentBase.DataType.Number,
            precision: 2
          }
        ]
      }
    ],
    excludedPaths: [
      {
        path: "/metaData/*"
      }
    ]
  };

  const { body: coll, container } = await database.containers.create({ id: collId, indexingPolicy: indexPolicySpec });
  console.log("Collection '" + coll.id + "' created with excludedPaths");

  const docId = "doc";

  const docSpec = {
    id: docId,
    metaData: "meta",
    subDoc: {
      searchable: "searchable",
      subSubDoc: { someProperty: "value" }
    }
  };

  //create a document
  console.log("Creating document");
  const { item } = await container.items.create(docSpec);
  console.log("Document created");

  //try a query on an excluded property, expect no results
  const querySpec = {
    query: "SELECT * FROM root r WHERE r.metaData = @value",
    parameters: [
      {
        name: "@value",
        value: "meta"
      }
    ]
  };

  try {
    //expecting an exception on this query due to the fact that it includes paths that
    //have been excluded. If you want to force a scan, then enableScanInQuery like we did in forceScanOnHashIndexPath()
    console.log("Querying for document where metaData = 'meta', should throw an exception");
    await container.items.query(querySpec).toArray();
    throw new Error("Should've produced an error");
  } catch (err) {
    if (err.code !== undefined) {
      console.log("Threw, as expected");
    } else {
      throw err;
    }
  } //show that you can still read the document by its id
  console.log("Can still readDocument using '" + item.id + "'");
  const { body: itemDef } = await item.read();
  console.log("Document '" + item.id + "' read and it's _self is '" + itemDef._self + "'");

  await container.delete();
  console.log("Collection '" + collId + "' deleted");
}

/**
 *
 * @param {cosmos.Database} database
 */
async function performIndexTransforms(database) {
  //create collection with default index policy
  console.log("Creating collection with default index policy (i.e. no range on strings)");
  const collId = "IndexTransformsDemo";

  const { body: coll, container } = await database.containers.create({ id: collId });
  console.log("Collection '" + coll.id + "' created");

  //create document
  const docSpec = {
    id: "doc",
    stringField: "a string"
  };

  console.log("Creating document");
  const { body: doc, item } = await container.items.create(docSpec);
  console.log("Document with id '" + doc.id + "' created");

  //define a new indexPolicy which includes Range on all string paths (and Hash on all numbers)
  const indexPolicySpec = {
    includedPaths: [
      {
        path: "/*",
        indexes: [
          {
            kind: "Range",
            dataType: "String"
          },
          {
            kind: "Range",
            dataType: "Number"
          }
        ]
      }
    ]
  };

  const collSpec = { id: collId };
  collSpec.indexingPolicy = indexPolicySpec;

  //replaceCollection to update the indexPolicy
  await container.replace(collSpec);
  console.log("Waiting for index transform to be completed");

  //Index transform is an async operation that is performed on a Collection
  //You can contiue to use the collection while this is happening, but depending
  //on the transform and your queries you may get inconsistent results as the index is updated

  //Here, we'll just wait for index transform to complete.
  //this will be almost instant because we only have one document
  //but this can take some time on larger collections
  await waitForIndexTransformToComplete(container);
  console.log("Index transform completed");

  const querySpec = {
    query: "SELECT * FROM root r WHERE r.stringField > @value",
    parameters: [
      {
        name: "@value",
        value: "a"
      }
    ]
  };

  //queryDocuments doing a range operation on a string (this would've failed without the transform)
  const { result: results } = await container.items.query(querySpec).toArray();
  if (results.length == 0) {
    throw new Error("Should've found a doc");
  } else {
    const queryDoc = results[0];
    console.log("Document with id '" + queryDoc.id + "' found");
  }
}

async function sleep(timeMS) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, timeMS);
  });
}

/**
 * To figure out the progress of and index transform,
  do a collection read and check the header property of the response.
  The headers collection includes a header that indicates progress between 0 and 100
 * @param {cosmos.Container} container 
 */
async function waitForIndexTransformToComplete(container) {
  //To figure out the progress of and index transform,
  //do a readCollection and check the 3rd parameter of the callback
  //The headers collection includes a header that indicates progress between 0 and 100
  let progress = 0;
  let count = 0;

  while (progress >= 0 && progress < 100) {
    console.log("Reading collection");
    const { headers } = await container.read();

    progress = headers["x-ms-documentdb-collection-index-transformation-progress"];
    console.log("Progress is currently " + progress);

    console.log("Waiting for 100ms");
    await sleep(100);
  }
  console.log("Done waiting, progress == 100");
}

async function handleError(error) {
  console.log("\nAn error with code '" + error.code + "' has occurred:");
  console.log("\t" + JSON.parse(error.body).message);

  await finish();
}

async function finish() {
  await client.database(databaseId).delete();
  console.log("\nEnd of demo.");
}
