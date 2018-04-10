import { IHeaders } from "./queryExecutionContext";
export declare class SessionContainer {
    private hostname;
    private collectionNameToCollectionResourceId;
    private collectionResourceIdToSessionTokens;
    constructor(hostname: string, collectionNameToCollectionResourceId?: {
        [collectionName: string]: string;
    }, collectionResourceIdToSessionTokens?: {
        [collectionResourceId: string]: {
            [SessionName: string]: string;
        };
    });
    getHostName(): string;
    getPartitionKeyRangeIdToTokenMap(request: any): {
        [SessionName: string]: string;
    };
    getPartitionKeyRangeIdToTokenMapPrivate(isNameBased: boolean, rId: string, resourceAddress: string): {
        [SessionName: string]: string;
    };
    resolveGlobalSessionToken(request: any): string;
    resolveGlobalSessionTokenPrivate(isNameBased: boolean, rId: string, resourceAddress: string): string;
    clearToken(request: any): void;
    setSessionToken(request: any, reqHeaders: IHeaders, resHeaders: IHeaders): void;
    setSesisonTokenPrivate(collectionRid: string, collectionName: string, sessionToken: string): void;
    getCombinedSessionToken(tokens: {
        [key: string]: string;
    }): string;
    compareAndSetToken(newToken: string, oldTokens: {
        [key: string]: string;
    }): void;
    isReadingFromMaster(resourceType: string, operationType: string): boolean;
}
