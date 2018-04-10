export declare class UriFactory {
    static createDatabaseUri(databaseId: string): string;
    static createDocumentCollectionUri(databaseId: string, collectionId: string): string;
    static createUserUri(databaseId: string, userId: string): string;
    static createDocumentUri(databaseId: string, collectionId: string, documentId: string): string;
    static createPermissionUri(databaseId: string, userId: string, permissionId: string): string;
    static createStoredProcedureUri(databaseId: string, collectionId: string, storedProcedureId: string): string;
    static createTriggerUri(databaseId: string, collectionId: string, triggerId: string): string;
    static createUserDefinedFunctionUri(databaseId: string, collectionId: string, udfId: string): string;
    static createConflictUri(databaseId: string, collectionId: string, conflictId: string): string;
    static createAttachmentUri(databaseId: string, collectionId: string, documentId: string, attachmentId: string): string;
    static createPartitionKeyRangesUri(databaseId: string, collectionId: string): string;
}
