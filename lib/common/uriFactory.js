"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
class UriFactory {
    static createDatabaseUri(databaseId) {
        databaseId = _1.Helper.trimSlashFromLeftAndRight(databaseId);
        _1.Helper.validateResourceId(databaseId);
        return _1.Constants.Path.DatabasesPathSegment + "/" +
            databaseId;
    }
    static createDocumentCollectionUri(databaseId, collectionId) {
        collectionId = _1.Helper.trimSlashFromLeftAndRight(collectionId);
        _1.Helper.validateResourceId(collectionId);
        return this.createDatabaseUri(databaseId) + "/" +
            _1.Constants.Path.CollectionsPathSegment + "/" +
            collectionId;
    }
    static createUserUri(databaseId, userId) {
        userId = _1.Helper.trimSlashFromLeftAndRight(userId);
        _1.Helper.validateResourceId(userId);
        return this.createDatabaseUri(databaseId) + "/" +
            _1.Constants.Path.UsersPathSegment + "/" +
            userId;
    }
    static createDocumentUri(databaseId, collectionId, documentId) {
        documentId = _1.Helper.trimSlashFromLeftAndRight(documentId);
        _1.Helper.validateResourceId(documentId);
        return this.createDocumentCollectionUri(databaseId, collectionId) + "/" +
            _1.Constants.Path.DocumentsPathSegment + "/" +
            documentId;
    }
    static createPermissionUri(databaseId, userId, permissionId) {
        permissionId = _1.Helper.trimSlashFromLeftAndRight(permissionId);
        _1.Helper.validateResourceId(permissionId);
        return this.createUserUri(databaseId, userId) + "/" +
            _1.Constants.Path.PermissionsPathSegment + "/" +
            permissionId;
    }
    static createStoredProcedureUri(databaseId, collectionId, storedProcedureId) {
        storedProcedureId = _1.Helper.trimSlashFromLeftAndRight(storedProcedureId);
        _1.Helper.validateResourceId(storedProcedureId);
        return UriFactory.createDocumentCollectionUri(databaseId, collectionId) + "/" +
            _1.Constants.Path.StoredProceduresPathSegment + "/" +
            storedProcedureId;
    }
    static createTriggerUri(databaseId, collectionId, triggerId) {
        triggerId = _1.Helper.trimSlashFromLeftAndRight(triggerId);
        _1.Helper.validateResourceId(triggerId);
        return this.createDocumentCollectionUri(databaseId, collectionId) + "/" +
            _1.Constants.Path.TriggersPathSegment + "/" +
            triggerId;
    }
    static createUserDefinedFunctionUri(databaseId, collectionId, udfId) {
        udfId = _1.Helper.trimSlashFromLeftAndRight(udfId);
        _1.Helper.validateResourceId(udfId);
        return this.createDocumentCollectionUri(databaseId, collectionId) + "/" +
            _1.Constants.Path.UserDefinedFunctionsPathSegment + "/" +
            udfId;
    }
    static createConflictUri(databaseId, collectionId, conflictId) {
        conflictId = _1.Helper.trimSlashFromLeftAndRight(conflictId);
        _1.Helper.validateResourceId(conflictId);
        return this.createDocumentCollectionUri(databaseId, collectionId) + "/" +
            _1.Constants.Path.ConflictsPathSegment + "/" +
            conflictId;
    }
    static createAttachmentUri(databaseId, collectionId, documentId, attachmentId) {
        attachmentId = _1.Helper.trimSlashFromLeftAndRight(attachmentId);
        _1.Helper.validateResourceId(attachmentId);
        return this.createDocumentUri(databaseId, collectionId, documentId) + "/" +
            _1.Constants.Path.AttachmentsPathSegment + "/" +
            attachmentId;
    }
    static createPartitionKeyRangesUri(databaseId, collectionId) {
        return this.createDocumentCollectionUri(databaseId, collectionId) + "/" +
            _1.Constants.Path.PartitionKeyRangesPathSegment;
    }
}
exports.UriFactory = UriFactory;
//# sourceMappingURL=uriFactory.js.map