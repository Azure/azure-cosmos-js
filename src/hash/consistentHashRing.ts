import { Base } from "../base";
import { MurmurHash, Key } from "./murmurHash";

export { Key } from "./murmurHash";

export class ConsistentHashRing {
    private _computeHash: any; // TODO
    private _partitions: any[]; // TODO

    /**
     * Initializes a new instance of the ConsistentHashRing
     * @param {string[]} nodes - Array of collection links
     * @param {object} options - Options to initialize the ConsistentHashRing
     * @param {function} options.computeHash - Function to compute the hash for a given link or partition key
     * @param {function} options.numberOfVirtualNodesPerCollection - Number of points in the ring to assign to each collection link
     */
    constructor(nodes: string[], options: any) { // TODO: options
        ConsistentHashRing._throwIfInvalidNodes(nodes);

        options = options || {};
        options.numberOfVirtualNodesPerCollection = options.numberOfVirtualNodesPerCollection || 128;
        options.computeHash = options.computeHash || MurmurHash.hash;

        this._computeHash = options.computeHash;
        this._partitions = ConsistentHashRing._constructPartitions(nodes, options.numberOfVirtualNodesPerCollection, options.computeHash);
    }

    public getNode(key: Key) {
        var hash = this._computeHash(key);
        var partition = ConsistentHashRing._search(this._partitions, hash);
        return this._partitions[partition].node;
    }
    
    private static _constructPartitions(nodes: string[], partitionsPerNode: number, computeHashFunction: any) { //TODO: computeHashFunction
        var partitions = new Array();
        nodes.forEach(function (node) {
            var hashValue = computeHashFunction(node);
            for (var j = 0; j < partitionsPerNode; j++) {
                partitions.push({
                    hashValue: hashValue,
                    node: node
                });

                hashValue = computeHashFunction(hashValue);
            }
        });

        partitions.sort(function (x, y) {
            return ConsistentHashRing._compareHashes(x.hashValue, y.hashValue);
        });
        return partitions;
    }
    
    private static _compareHashes(x: number, y: number) {
        if (x < y) return -1;
        if (x > y) return 1;
        return 0;
    }
    
    private static _search(partitions: any[], hashValue: string) { //TODO: Partitions
        for (var i = 0; i < partitions.length - 1; i++) {
            if (hashValue >= partitions[i].hashValue && hashValue < partitions[i + 1].hashValue) {
                return i;
            }
        }

        return partitions.length - 1;
    }
    
    private static _throwIfInvalidNodes(nodes: string[]) {
        if (Array.isArray(nodes)) {
            return;
        }

        throw new Error("Invalid argument: 'nodes' has to be an array.");
    }
}
