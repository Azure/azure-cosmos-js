// @ts-check
console.log();
console.log("Azure Cosmos DB Node.js Samples");
console.log("================================");
console.log();
console.log("USER MANAGEMENT");
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

var databaseLink = "dbs/" + databaseId;
var col1Name = "COL1";
var col2Name = "COL2";
var user1Name = "Thomas Andersen";
var user2Name = "Robin Wakefield";
var doc1Name = "doc1";
var doc2Name = "doc2";
var doc3Name = "doc3";

// Establish a new instance of the DocumentDBClient to be used throughout this demo
var client = new CosmosClient({ endpoint, auth: { masterKey } });

async function run() {
  const resources = await init();
  await attemptAdminOperations(resources.container1, resources.user1, resources.permission1);
  await attemptWriteWithReadPermissionAsync(resources.container1, resources.user1, resources.permission1);
  await attemptReadFromTwoCollections(
    resources.container1,
    resources.container2,
    resources.user1,
    resources.permission1,
    resources.permission2
  );
}

async function init() {
  //--------------------------------------------------------------------------------------------------
  // We need a Database, Two Collections, Two Users, and some permissions for this sample,
  // So let's go ahead and set these up initially
  //--------------------------------------------------------------------------------------------------
  const { database } = await client.databases.create({ id: databaseId });
  const { container: container1 } = await database.containers.create({ id: col1Name });
  const { container: container2 } = await database.containers.create({ id: col2Name });

  var docDef = { id: doc1Name };

  var userDef = { id: user1Name };

  var permissionDef;

  const { item: item1 } = await container1.items.create(docDef);
  console.log(doc1Name + "Created in " + col1Name + " !");

  docDef = { id: doc2Name };

  const { item: item2 } = await container1.items.create(docDef);
  console.log(doc2Name + "Created in " + col1Name + " !");

  docDef = { id: doc3Name };

  const { item: item3 } = await container2.items.create(docDef);
  console.log(doc3Name + " Created in " + col2Name + " !");

  const { user: user1 } = await database.users.create(userDef);
  console.log(user1Name + " created!");

  userDef = { id: user2Name };

  const { user: user2 } = await database.users.create(userDef);
  console.log(user2Name + " created!");

  // Read Permission on col1 for user1
  permissionDef = { id: "p1", permissionMode: cosmos.DocumentBase.PermissionMode.Read, resource: container1.url };

  const { ref: permission1 } = await user1.permissions.create(permissionDef);
  console.log("Read only permission assigned to Thomas Andersen on col1!");

  permissionDef = { id: "p2", permissionMode: cosmos.DocumentBase.PermissionMode.All, resource: item1.url };

  // All Permissions on Doc1 for user1
  const { ref: permission2 } = await user1.permissions.create(permissionDef);
  console.log("All permission assigned to Thomas Andersen on doc1!");

  permissionDef = { id: "p3", permissionMode: cosmos.DocumentBase.PermissionMode.Read, resource: container2.url };

  // Read Permissions on Col2 for user1
  const { ref: permission3 } = await user1.permissions.create(permissionDef);
  console.log("Read permission assigned to Thomas Andersen on col2!");

  permissionDef = { id: "p4", permissionMode: cosmos.DocumentBase.PermissionMode.All, resource: container2.url };

  const { ref: permission4 } = await user2.permissions.create(permissionDef);
  console.log("All permission assigned to Robin Wakefield on col2!");

  const { result: permissions } = await user1.permissions.readAll().toArray();
  console.log("Fetched permission for Thomas Andersen. Count is : " + permissions.length);

  return { user1, user2, container1, container2, permission1, permission2, permission3, permission4 };
}

//handle error
function handleError(error) {
  console.log();
  console.log("An error with code '" + error.code + "' has occurred:");
  console.log("\t" + JSON.parse(error.body).message);
  console.log();

  finish();
}

function finish() {
  console.log();
  console.log("End of demo.");
}

/**
 *
 * @param {cosmos.Permission} permission
 */
async function getResourceToken(container, permission) {
  const { body: permDef } = await permission.read();
  const resourceToken = {};
  resourceToken[container.url] = permDef._token;
  return resourceToken;
}

/**
 * Attempt to do admin operations when user only has Read on a collection
 * @param {cosmos.Container} container
 * @param {cosmos.User} user
 * @param {cosmos.Permission} permission
 */
async function attemptAdminOperations(container, user, permission) {
  const resourceTokens = await getResourceToken(container, permission);
  const client = new CosmosClient({
    endpoint,
    auth: {
      resourceTokens
    }
  });

  await client
    .database(databaseId)
    .container(containerId)
    .items.readAll()
    .toArray();
  console.log(user.id + " able to perform read operation on collection 1");

  try {
    await client.databases.readAll().toArray();
  } catch (err) {
    console.log(
      "Expected error occurred as " +
        user.id +
        " does not have access to get the list of databases. Error code : " +
        err.code
    );
  }
}

/**
 * attempts to write in collection 1 with user 1 permission. It fails as the user1 has read only permission on col1
 * @param {cosmos.Container} container
 * @param {cosmos.User} user
 * @param {cosmos.Permission} permission
 */
async function attemptWriteWithReadPermissionAsync(container, user, permission) {
  const resourceTokens = await getResourceToken(container, permission);
  const client = new CosmosClient({
    endpoint,
    auth: {
      resourceTokens
    }
  });

  const docDef = { id: "not allowed" };
  try {
    await client
      .database(databaseId)
      .container(containerId)
      .items.upsert(docDef);
  } catch (err) {
    console.log(
      "Expected error occurred as " +
        user.id +
        " does not have access to insert a document in COL1. Error code : " +
        err.code
    );
  }
}

//attempts to read from both the collections as the user has read permission
/**
 *
 * @param {cosmos.Container} container1
 * @param {cosmos.Container} container2
 * @param {cosmos.User} user1
 * @param {cosmos.Permission} permission1
 * @param {cosmos.Permission} permission2
 */
async function attemptReadFromTwoCollections(container1, container2, user1, permission1, permission2) {
  const token1 = await getResourceToken(container1, permission1);
  const token2 = await getResourceToken(container2, permission2);
  const resourceTokens = { ...token1, ...token2 };

  const client = new CosmosClient({
    endpoint,
    auth: {
      resourceTokens
    }
  });

  const { result: documents1 } = await client
    .database(databaseId)
    .container(container1.id)
    .items.readAll()
    .toArray();
  console.log(user1.id + " able to read documents from COL1. Document count is " + documents1.length);

  const { result: documents2 } = await client
    .database(databaseId)
    .container(container2.id)
    .items.readAll()
    .toArray();

  console.log(user1.id + " able to read documents from COL2. Document count is " + documents2.length);

  var docDef = { id: "not allowed" };

  try {
    await client
      .database(databaseId)
      .container(container2.id)
      .items.upsert(docDef);
  } catch (err) {
    console.log(
      "Expected error occurred as " +
        user1.id +
        " does not have access to insert a document in COL2. Error code : " +
        err.code
    );
  }
}
