import { Range } from "../range";
export interface Document {
    [key: string]: any;
}
export declare type PartitionKey = string | Range;
export declare enum ConsistencyLevel {
    Strong = "Strong",
    BoundedStaleness = "BoundedStaleness",
    Session = "Session",
    Eventual = "Eventual",
    ConsistentPrefix = "ConsistentPrefix",
}
export declare enum IndexingMode {
    Consistent = "consistent",
    Lazy = "lazy",
    None = "none",
}
export declare enum IndexKind {
    Hash = "Hash",
    Range = "Range",
    Spatial = "Spatial",
}
export declare enum DataType {
    Number = "Number",
    String = "String",
    Point = "Point",
    LineString = "LineString",
    Polygon = "Polygon",
}
export declare enum PartitionKind {
    Hash = "Hash",
}
export declare enum ConnectionMode {
    Gateway = 0,
}
export declare enum QueryCompatibilityMode {
    Default = 0,
    Query = 1,
    SqlQuery = 2,
}
export declare enum MediaReadMode {
    Buffered = "Buffered",
    Streamed = "Streamed",
}
export declare enum PermissionMode {
    None = "none",
    Read = "read",
    All = "all",
}
export declare enum TriggerType {
    Pre = "pre",
    Post = "post",
}
export declare enum TriggerOperation {
    All = "all",
    Create = "create",
    Update = "update",
    Delete = "delete",
    Replace = "replace",
}
export declare enum UserDefinedFunctionType {
    Javascript = "Javascript",
}
