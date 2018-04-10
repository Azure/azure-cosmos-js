"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ConsistencyLevel;
(function (ConsistencyLevel) {
    ConsistencyLevel["Strong"] = "Strong";
    ConsistencyLevel["BoundedStaleness"] = "BoundedStaleness";
    ConsistencyLevel["Session"] = "Session";
    ConsistencyLevel["Eventual"] = "Eventual";
    ConsistencyLevel["ConsistentPrefix"] = "ConsistentPrefix";
})(ConsistencyLevel = exports.ConsistencyLevel || (exports.ConsistencyLevel = {}));
var IndexingMode;
(function (IndexingMode) {
    IndexingMode["Consistent"] = "consistent";
    IndexingMode["Lazy"] = "lazy";
    IndexingMode["None"] = "none";
})(IndexingMode = exports.IndexingMode || (exports.IndexingMode = {}));
var IndexKind;
(function (IndexKind) {
    IndexKind["Hash"] = "Hash";
    IndexKind["Range"] = "Range";
    IndexKind["Spatial"] = "Spatial";
})(IndexKind = exports.IndexKind || (exports.IndexKind = {}));
var DataType;
(function (DataType) {
    DataType["Number"] = "Number";
    DataType["String"] = "String";
    DataType["Point"] = "Point";
    DataType["LineString"] = "LineString";
    DataType["Polygon"] = "Polygon";
})(DataType = exports.DataType || (exports.DataType = {}));
var PartitionKind;
(function (PartitionKind) {
    PartitionKind["Hash"] = "Hash";
})(PartitionKind = exports.PartitionKind || (exports.PartitionKind = {}));
var ConnectionMode;
(function (ConnectionMode) {
    ConnectionMode[ConnectionMode["Gateway"] = 0] = "Gateway";
})(ConnectionMode = exports.ConnectionMode || (exports.ConnectionMode = {}));
var QueryCompatibilityMode;
(function (QueryCompatibilityMode) {
    QueryCompatibilityMode[QueryCompatibilityMode["Default"] = 0] = "Default";
    QueryCompatibilityMode[QueryCompatibilityMode["Query"] = 1] = "Query";
    QueryCompatibilityMode[QueryCompatibilityMode["SqlQuery"] = 2] = "SqlQuery";
})(QueryCompatibilityMode = exports.QueryCompatibilityMode || (exports.QueryCompatibilityMode = {}));
var MediaReadMode;
(function (MediaReadMode) {
    MediaReadMode["Buffered"] = "Buffered";
    MediaReadMode["Streamed"] = "Streamed";
})(MediaReadMode = exports.MediaReadMode || (exports.MediaReadMode = {}));
var PermissionMode;
(function (PermissionMode) {
    PermissionMode["None"] = "none";
    PermissionMode["Read"] = "read";
    PermissionMode["All"] = "all";
})(PermissionMode = exports.PermissionMode || (exports.PermissionMode = {}));
var TriggerType;
(function (TriggerType) {
    TriggerType["Pre"] = "pre";
    TriggerType["Post"] = "post";
})(TriggerType = exports.TriggerType || (exports.TriggerType = {}));
var TriggerOperation;
(function (TriggerOperation) {
    TriggerOperation["All"] = "all";
    TriggerOperation["Create"] = "create";
    TriggerOperation["Update"] = "update";
    TriggerOperation["Delete"] = "delete";
    TriggerOperation["Replace"] = "replace";
})(TriggerOperation = exports.TriggerOperation || (exports.TriggerOperation = {}));
var UserDefinedFunctionType;
(function (UserDefinedFunctionType) {
    UserDefinedFunctionType["Javascript"] = "Javascript";
})(UserDefinedFunctionType = exports.UserDefinedFunctionType || (exports.UserDefinedFunctionType = {}));
//# sourceMappingURL=documents.js.map