import { ConsistencyLevel } from ".";
export declare class DatabaseAccount {
    _writableLocations: LocationsType;
    _readableLocations: LocationsType;
    DatabasesLink: string;
    MediaLink: string;
    MaxMediaStorageUsageInMB: number;
    CurrentMediaStorageUsageInMB: number;
    ConsumedDocumentStorageInMB: number;
    ReservedDocumentStorageInMB: number;
    ProvisionedDocumentStorageInMB: number;
    ConsistencyPolicy: ConsistencyLevel;
    readonly WritableLocations: Array<{
        [key: string]: string;
    }>;
    readonly ReadableLocations: Array<{
        [key: string]: string;
    }>;
}
export declare type LocationsType = Array<{
    [key: string]: string;
}>;
