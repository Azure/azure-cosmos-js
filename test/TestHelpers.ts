import * as assert from "assert";
import { DocumentBase, DocumentClient } from "../src";

export class TestHelpers {
    public static async removeAllDatabases(host: string, masterKey: string) {
        try {
            const client = new DocumentClient(host, { masterKey });
            const { result: databases } = await client.readDatabases().toArray();

            const length = databases.length;

            if (length === 0) {
                return;
            }

            const count = 0;
            await Promise.all(databases.map<Promise<any>>(async (database) => client.deleteDatabase(database._self)));
        } catch (err) {
            // TODO: remove console logging for errors and add ts-lint flag back
            console.log("An error occured", err);
            assert.fail(err);
            throw err;
        }
    }

    public static getDatabaseLink (isNameBasedLink: boolean, db: any) {
        if (isNameBasedLink) {
            return "dbs/" + db.id;
        } else {
            return db._self;
        }
    }

    public static getCollectionLink (isNameBasedLink: boolean, db: any, coll: any) {
        if (isNameBasedLink) {
            return "dbs/" + db.id + "/colls/" + coll.id;
        } else {
            return coll._self;
        }
    }

    public static getDocumentLink (isNameBasedLink: boolean, db: any, coll: any, doc: any) {
        if (isNameBasedLink) {
            return "dbs/" + db.id + "/colls/" + coll.id + "/docs/" + doc.id;
        } else {
            return doc._self;
        }
    }

    public static async bulkInsertDocuments (
        client: DocumentClient, isNameBased: boolean, db: any, collection: any, documents: any) {
        const returnedDocuments = [];
        for (const doc of documents) {
            try {
            const {result: document} = await client.createDocument(
                TestHelpers.getCollectionLink(isNameBased, db, collection), doc);
            returnedDocuments.push(document);
            } catch (err) {
                throw err;
            }
        }
        return returnedDocuments;
    }
}
