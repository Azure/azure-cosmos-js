// @ts-check
'use strict';
console.log();
console.log('Azure Cosmos DB Node.js Samples');
console.log('================================');
console.log();
console.log('DOCUMENT MANAGEMENT');
console.log('===================');
console.log();

const cosmos = require('../../lib/');
const CosmosClient = cosmos.CosmosClient;
const config = require('../Shared/config')
const fs = require('fs')
const async = require('async')
const databaseId = config.names.database
const collectionId = config.names.collection
let dbLink;
let collLink;

const endpoint = config.connection.endpoint;
const masterKey = config.connection.authKey;

const getDocumentDefinitions = function () {
    const data = fs.readFileSync('../Shared/Data/Families.json', 'utf8');   
    return JSON.parse(data).Families;
};

// Establish a new instance of the DocumentDBClient to be used throughout this demo
var client = new CosmosClient( {endpoint, auth: { masterKey }});

//NOTE: 
//when using the new IDBased Routing URIs, instead of the _self, as we 're doing in this sample
//ensure that the URI does not end with a trailing '/' character
//so dbs/databaseId instead of dbs/databaseId/

//-------------------------------------------------------------------------------------------------------
// This demo performs a few steps
// 1. createDocuments   - Insert some documents in to collection
// 2. listDocuments     - Read the document feed for a collection
// 3. readDocument      
// 3.1                  - Read a single document by its id
// 3.2                  - Use ETag and AccessCondition to only return a document if ETag does not match
// 4. queryDocuments    - Query for documents by some property
// 5. replaceDocument   
// 5.1                  - Update some properties and replace the document
// 5.2                  - Use ETag and AccessCondition to only replace document if it has not changed
// 6. upsertDocument    - Update a document if it exists, else create new document
// 7. deleteDocument    - Given a document id, delete it
//-------------------------------------------------------------------------------------------------------

async function run() {
//ensuring a database & collection exists for us to work with
    await init();
    
    const database = client.databases.get(databaseId);
    const container = database.containers.get(collectionId);

    //1.
    console.log('\n1. insertDocuments in to database \'' + databaseId + '\' and collection \'' + collectionId + '\'');
    const docDefs = getDocumentDefinitions();
    const p = [];
    for(const docDef of docDefs) {
        p.push(container.items.create(docDef));
    }
    await Promise.all(p);
    console.log(docDefs.length + ' docs created');

    //2. 
    console.log('\n2. listDocuments in collection \'' + collLink + '\'');
    const {result: docs} = await container.items.readAll().toArray();
    
    for (const doc of docs) {
        console.log(doc.id);
    }

    //3.1
    const item = container.items.get(docs[0].id);
    console.log('\n3.1 readDocument \'' + item.id + '\'');
    const {result: readDoc} = await item.read();
    console.log('Document with id \'' + item.id + '\' found');

    //3.2                 
    console.log('\n3.2 readDocument with AccessCondition and no change to _etag');
    const {result: item2, headers} = await item.read({ accessCondition : { type: 'IfNoneMatch', condition: readDoc._etag } });                        
    if (!item2 && headers["content-length"] == 0) {
        console.log('As expected, no document returned. This is because the etag sent matched the etag on the server. i.e. you have the latest version of the doc already');
    }

    //if we someone else updates this doc, its etag on the server would change.
    //repeating the above read with the old etag would then get a document in the response                        
    readDoc.foo = 'bar';
    await item.replace(readDoc);
    const {result: item3} = await item.read({ accessCondition : { type: 'IfNoneMatch', condition: readDoc._etag } }); 
    if (!item3 && headers["content-length"] == 0) {
        throw ('Expected document this time. Something is wrong!');
    } else {
        console.log('This time the read request returned the document because the etag values did not match');
    }

    //4.
    var querySpec = {
        query: 'SELECT * FROM Families f WHERE  f.lastName = @lastName',
        parameters: [
            {
                name: '@lastName',
                value: 'Andersen'
            }
        ]
    };

    console.log('\n4. queryDocuments in collection \'' + collLink + '\'');
    const {result: results} = await container.items.query(querySpec).toArray();

    if (results.length == 0) {
        throw ("No documents found matching");
    } else if (results.length > 1) {
        throw ("More than 1 document found matching");
    }

    const person = results[0];
    console.log('The \'' + person.id + '\' family has lastName \'' + person.lastName + '\'');
    console.log('The \'' + person.id + '\' family has ' + person.children.length + ' children \'');

    //add a new child to this family, and change the family's lastName
    const childDef = {
        "firstName": "Newborn",
        "gender": "unknown",
        "fingers": 10,
        "toes": 10
    };

    person.children.push(childDef);
    person.lastName = "Updated Family";

    //5.1
    console.log('\n5.1 replaceDocument with id \'' + item.id + '\'');
    const {result: updated} = await item.replace(person);

    console.log('The \'' + person.id + '\' family has lastName \'' + person.lastName + '\'');
    console.log('The \'' + person.id + '\' family has ' + person.children.length + ' children \'');

    // 5.2
    console.log('\n5.2 trying to replaceDocument when document has changed in the database');
    // The replaceDocument above will work even if there's a new version of doc on the server from what you originally read
    // If you want to prevent this from happening you can opt-in to a conditional update
    // Using accessCondition and etag you can specify that the replace only occurs if the etag you are sending matches the etag on the server
    // i.e. Only replace if the document hasn't changed

    // let's go update doc
    person.foo = 'bar';
    await item.replace(person);
    
    // now let's try another update to doc with accessCondition and etag set
    person.foo = 'should never get set';
    try {
        await item.replace(person, { accessCondition: { type: 'IfMatch', condition: person._etag } });
        throw new Error("This should have failed!");
    } catch (err) {
        if (err.code == 412) {
            console.log('As expected, the replace document failed with a pre-condition failure');
        } else {
            throw err;
        }
    }

    //6.
    console.log('\n6. deleteDocument \'' + item.id + '\'');
    await item.delete();
}

async function init() {
    await getOrCreateDatabase(databaseId);
    await getOrCreateCollection(databaseId, collectionId);
}

async function getOrCreateCollection(databaseId, id, callback) {
    const database = client.databases.get(databaseId);
    try {
        try {
            await database.containers.get(id).read();
        } catch (err) {
            // if it doesn't exist, create it
            if(err.code === 404) {
                await database.containers.create({id});
            } else {
                throw err;
            }
        }
    } catch (err) {
        throw err;
    }
}

async function getOrCreateDatabase(id, callback) {    
    try {
        try {
            await client.databases.get(id).read();
        } catch (err) {
            // if it doesn't exist, create it
            if(err.code === 404) {
                await client.databases.create({id});
            } else {
                throw err;
            }
        }
    } catch (err) {
        throw err;
    }
}

async function handleError(error) {async 
    console.log('\nAn error with code \'' + error.code + '\' has occurred:');
    console.log('\t' + JSON.parse(error.body).message);
    
    await finish();
}

async function finish() {
    await client.databases.get(dbLink).delete();
    console.log('\nEnd of demo.');
}

run().then(finish).catch(handleError);
