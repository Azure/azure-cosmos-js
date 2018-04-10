import { Key } from "./murmurHash";
export { Key } from "./murmurHash";
export declare class ConsistentHashRing {
    private computeHash;
    private partitions;
    constructor(nodes: string[], options: any);
    getNode(key: Key): any;
    private static _constructPartitions(nodes, partitionsPerNode, computeHashFunction);
    private static _compareHashes(x, y);
    private static _search(partitions, hashValue);
    private static _throwIfInvalidNodes(nodes);
}
