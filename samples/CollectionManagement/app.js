// @ts-check
'use strict';
console.log();
console.log('Azure Cosmos DB Node.js Samples');
console.log('================================');
console.log();
console.log('COLLECTION MANAGEMENT');
console.log('=====================');
console.log();

const cosmos = require('../../lib/');
const CosmosClient = cosmos.CosmosClient;
const config = require('../Shared/config')
const databaseId = config.names.database
const collectionId = config.names.collection

var host = config.connection.endpoint;
var masterkey = config.connection.authKey;

// Establish a new instance of the DocumentDBClient to be used throughout this demo
var client = new CosmosClient({ endpoint: host, auth: { masterkey } });

//---------------------------------------------------------------------------------
// This demo performs a few steps
// 1. createCollection  - given an id, create a new Collectionwith thedefault indexingPolicy
// 2. listCollections   - example of using the QueryIterator to get a list of Collections in a Database
// 3. readCollection    - Read a collection by its _self
// 4. deleteCollection  - given just the collection id, delete the collection
//---------------------------------------------------------------------------------

/** @type {cosmos.Database} */
let database;

//ensuring a database exists for us to work with
async function run() {
    await init(databaseId);

    //1.
    console.log('1. createCollection ith id \'' + collectionId + '\'');
    await database.containers.create({id: collectionId});

    //2.
    console.log('\n2. listCollections in database');
    const iterator = database.containers.read();
    for (const {result} of await iterator.forEach()) {
        console.log(result.id);
    }

    //3.
    console.log('\n3. collection.read');
    const container = database.containers.getContainer(collectionId);
    const {result: collection} = await container.read();

    console.log('Collection with url \'' + container.url + '\' was found its id is \'' + collection.id);

    //4.
    console.log('\n7. deleteCollection \'' + collectionId + '\'');
    container.delete();
}

async function init(databaseId) {
    //we're using queryDatabases here and not readDatabase
    //readDatabase will throw an exception if resource is not found
    //queryDatabases will not, it will return empty resultset. 

    var querySpec = {
        query: 'SELECT * FROM root r WHERE r.id=@id',
        parameters: [
            {
                name: '@id',
                value: databaseId
            }
        ]
    };

    const { result: results } = await client.databases.query(querySpec).toArray();
    if (results.length === 0) {
        var databaseDef = { id: databaseId };

        const { result: newDB } = await client.databases.create(databaseDef);
        client.databases.getDatabase(newDB.id);
        //database found, return it
    } else {
        client.databases.getDatabase(results[0].id);
    }
}

async function handleError(error) {
    console.log('\nAn error with code \'' + error.code + '\' has occurred:');
    console.log('\t' + JSON.parse(error.body).message);

    await finish();
}

async function finish() {
    try {
        await database.delete();
        console.log('\nEnd of demo.');
    } catch (err) {
        throw err;
    }
}

run().then(finish).catch(handleError);
