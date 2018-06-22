import { IndexingMode } from ".";
import { DataType, IndexKind } from "./documents";

export interface IndexingPolicy {
    indexingMode?: IndexingMode;
    automatic?: boolean;
    includedPaths?: IndexedPath[];
    excludedPaths?: IndexedPath[];
}

export interface IndexedPath {
    path: string;
    indexes?: Index[];
}

export interface Index {
    kind: IndexKind;
    dataType: DataType;
    precision?: number;
}
