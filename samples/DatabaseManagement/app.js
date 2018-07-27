// @ts-check
"use strict";
console.log();
console.log("Azure Cosmos DB Node.js Samples");
console.log("================================");
console.log();
console.log("DATABASE MANAGEMENT");
console.log("===================");
console.log();

const cosmos = require("../../lib/");
const CosmosClient = cosmos.CosmosClient;
const config = require("../Shared/config");
const databaseId = config.names.database;

const endpoint = config.connection.endpoint;
const masterKey = config.connection.authKey;

// Establish a new instance of the CosmosClient to be used throughout this demo
const client = new CosmosClient({ endpoint, auth: { masterKey } });

//---------------------------------------------------------------------------------------------------
// This demo performs the following CRUD operations on a Database
//
// 1. create Database    - If the database was not found, try create it
// 2. read all Databases     - Once the database was created, list all the databases on the account
// 3. read Database      - Read a database by its id (using new ID Based Routing)
// 4. delete Database    - Delete a database given its id
//
//---------------------------------------------------------------------------------------------------

async function run() {
  // 1.
  console.log("\n1. Create database, if it doesn't already exist '" + databaseId + "'");
  await client.databases.createIfNotExists({ id: databaseId });
  console.log("Database with id " + databaseId + " created.");

  // 2.
  console.log("\n2. listDatabases");
  for (const { db } of await client.databases.readAll().forEach()) {
    console.log(db.id);
  }

  // 3.
  console.log("\n3. readDatabase - with id '" + databaseId + "'");
  const { body: db } = await client.database(databaseId).read();
  console.log("Database with uri of 'dbs/" + db.id + "' was found");

  // 4.
  console.log("\n4. deleteDatabase with id '" + databaseId + "'");
  await client.database(databaseId).delete();
}

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

run()
  .catch(handleError)
  .then(finish);
