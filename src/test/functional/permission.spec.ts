import * as assert from "assert";
import { CosmosClient, DocumentBase } from "../../";
import { PermissionDefinition } from "../../client";
import testConfig from "./../common/_testConfig";
import { TestHelpers } from "./../common/TestHelpers";

const endpoint = testConfig.host;
const masterKey = testConfig.masterKey;
const client = new CosmosClient({ endpoint, auth: { masterKey } });

describe("NodeJS CRUD Tests", function () {
    this.timeout(process.env.MOCHA_TIMEOUT || 10000);
    // remove all databases from the endpoint before each test
    beforeEach(async function () {
        this.timeout(10000);
        try {
            await TestHelpers.removeAllDatabases(client);
        } catch (err) {
            throw err;
        }
    });
    describe("Validate Permission CRUD", function () {
        const permissionCRUDTest = async function (isUpsertTest: boolean) {
            try {
                // create container & database
                const container = await TestHelpers.getTestContainer(client, "Validate Permission Crud");

                // create user
                const { result: userDef } = await container.database.users.create({ id: "new user" });
                const user = container.database.users.get(userDef.id);
                // list permissions
                const { result: permissions } = await user.permissions.readAll().toArray();
                assert.equal(permissions.constructor, Array, "Value should be an array");
                const beforeCreateCount = permissions.length;
                const permissionDef: PermissionDefinition = {
                    id: "new permission",
                    permissionMode: DocumentBase.PermissionMode.Read,
                    resource: container.url,
                };

                // create permission
                const { result: createdPermission } = await TestHelpers.createOrUpsertPermission(
                    user, permissionDef, undefined, isUpsertTest);
                let permission = user.permissions.get(createdPermission.id);
                assert.equal(createdPermission.id, "new permission", "permission name error");

                // list permissions after creation
                const { result: permissionsAfterCreation } = await user.permissions.readAll().toArray();
                assert.equal(permissionsAfterCreation.length, beforeCreateCount + 1);

                // query permissions
                const querySpec = {
                    query: "SELECT * FROM root r WHERE r.id=@id",
                    parameters: [
                        {
                            name: "@id",
                            value: permissionDef.id,
                        },
                    ],
                };
                const { result: results } = await user.permissions.query(querySpec).toArray();
                assert(results.length > 0, "number of results for the query should be > 0");

                permissionDef.permissionMode = DocumentBase.PermissionMode.All;
                const { result: replacedPermission } =
                    await TestHelpers.replaceOrUpsertPermission(user, permissionDef, undefined, isUpsertTest);
                assert.equal(replacedPermission.permissionMode, DocumentBase.PermissionMode.All,
                    "permission mode should change");
                assert.equal(permissionDef.id, replacedPermission.id,
                    "permission id should stay the same");

                // to change the id of an existing resourcewe have to use replace
                permissionDef.id = "replaced permission";
                const { result: replacedPermission2 } = await permission.replace(permissionDef);
                assert.equal(replacedPermission2.id, "replaced permission", "permission name should change");
                assert.equal(permissionDef.id, replacedPermission2.id, "permission id should stay the same");
                permission = user.permissions.get(replacedPermission2.id);

                // read permission
                const { result: permissionAfterReplace } = await permission.read();
                assert.equal(permissionAfterReplace.id, permissionDef.id);

                // delete permission
                const { result: res } = await permission.delete();

                // read permission after deletion
                try {
                    await permission.read();
                    assert.fail("Must fail to read permission after deletion");
                } catch (err) {
                    const notFoundErrorCode = 404;
                    assert.equal(err.code, notFoundErrorCode, "response should return error code 404");
                }
            } catch (err) {
                throw err;
            }
        };

        const permissionCRUDOverMultiplePartitionsTest = async function (isUpsertTest: boolean) {
            try {
                // create database
                // create container
                const partitionKey = "id";
                const containerDefinition = {
                    id: "coll1",
                    partitionKey: { paths: ["/" + partitionKey], kind: DocumentBase.PartitionKind.Hash },
                };
                const container = await TestHelpers.getTestContainer(
                    client, "permission CRUD over multiple partitions", containerDefinition);

                // create user
                const { result: userDef } = await container.database.users.create({ id: "new user" });
                const user = container.database.users.get(userDef.id);

                // list permissions
                const { result: permissions } = await user.permissions.readAll().toArray();
                assert(Array.isArray(permissions), "Value should be an array");
                const beforeCreateCount = permissions.length;
                const permissionDefinition = {
                    id: "new permission",
                    permissionMode: DocumentBase.PermissionMode.Read,
                    resource: container.url,
                    resourcePartitionKey: [1],
                };

                // create permission
                const { result: permissionDef } = await TestHelpers.createOrUpsertPermission(
                    user, permissionDefinition, undefined, isUpsertTest);
                let permission = user.permissions.get(permissionDef.id);
                assert.equal(permissionDef.id, permissionDefinition.id, "permission name error");
                assert.equal(JSON.stringify(permissionDef.resourcePartitionKey),
                    JSON.stringify(permissionDefinition.resourcePartitionKey),
                    "permission resource partition key error");

                // list permissions after creation
                const { result: permissionsAfterCreation } = await user.permissions.readAll().toArray();
                assert.equal(permissionsAfterCreation.length, beforeCreateCount + 1);

                // query permissions
                const querySpec = {
                    query: "SELECT * FROM root r WHERE r.id=@id",
                    parameters: [
                        {
                            name: "@id",
                            value: permissionDef.id,
                        },
                    ],
                };
                const { result: results } = await user.permissions.query(querySpec).toArray();
                assert(results.length > 0, "number of results for the query should be > 0");

                // Replace permission
                permissionDef.permissionMode = DocumentBase.PermissionMode.All;
                const { result: replacedPermission } = await TestHelpers.replaceOrUpsertPermission(
                    user, permissionDef, undefined, isUpsertTest);
                assert.equal(replacedPermission.permissionMode,
                    DocumentBase.PermissionMode.All,
                    "permission mode should change");
                assert.equal(replacedPermission.id, permissionDef.id, "permission id should stay the same");
                assert.equal(JSON.stringify(replacedPermission.resourcePartitionKey),
                    JSON.stringify(permissionDef.resourcePartitionKey),
                    "permission resource partition key error");

                // to change the id of an existing resourcewe have to use replace
                permissionDef.id = "replaced permission";
                const { result: replacedPermission2 } = await permission.replace(permissionDef);
                assert.equal(replacedPermission2.id, permissionDef.id);
                permission = user.permissions.get(replacedPermission2.id);

                // read permission
                const { result: permissionAfterReplace } = await permission.read();
                assert.equal(permissionAfterReplace.id, replacedPermission2.id);

                // delete permission
                const { result: res } = await permission.delete();

                // read permission after deletion
                try {
                    await permission.read();
                    assert.fail("Must throw on read after delete");
                } catch (err) {
                    const notFoundErrorCode = 404;
                    assert.equal(err.code, notFoundErrorCode, "response should return error code 404");
                }
            } catch (err) {
                throw err;
            }

        };

        it("nativeApi Should do Permission CRUD operations successfully name based", async function () {
            try {
                await permissionCRUDTest(false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do Permission CRUD operations successfully name based with upsert", async function () {
            try {
                await permissionCRUDTest(true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do Permission CRUD operations over multiple partitions successfully name based",
            async function () {
                try {
                    await permissionCRUDOverMultiplePartitionsTest(false);
                } catch (err) {
                    throw err;
                }
            });

        it("nativeApi Should do Permission CRUD operations over multiple partitions successfully with upsert",
            async function () {
                try {
                    await permissionCRUDOverMultiplePartitionsTest(true);
                } catch (err) {
                    throw err;
                }
            });
    });
});
