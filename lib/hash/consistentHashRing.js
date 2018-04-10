"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const murmurHash_1 = require("./murmurHash");
class ConsistentHashRing {
    constructor(nodes, options) {
        ConsistentHashRing._throwIfInvalidNodes(nodes);
        options = options || {};
        options.numberOfVirtualNodesPerCollection = options.numberOfVirtualNodesPerCollection || 128;
        options.computeHash = options.computeHash || murmurHash_1.MurmurHash.hash;
        this.computeHash = options.computeHash;
        this.partitions = ConsistentHashRing
            ._constructPartitions(nodes, options.numberOfVirtualNodesPerCollection, options.computeHash);
    }
    getNode(key) {
        const hash = this.computeHash(key);
        const partition = ConsistentHashRing._search(this.partitions, hash);
        return this.partitions[partition].node;
    }
    static _constructPartitions(nodes, partitionsPerNode, computeHashFunction) {
        const partitions = nodes.reduce((p, node) => {
            let hashValue = computeHashFunction(node);
            for (let j = 0; j < partitionsPerNode; j++) {
                p.push({
                    hashValue,
                    node,
                });
                hashValue = computeHashFunction(hashValue);
            }
            return p;
        }, []);
        partitions.sort((x, y) => {
            return ConsistentHashRing._compareHashes(x.hashValue, y.hashValue);
        });
        return partitions;
    }
    static _compareHashes(x, y) {
        if (x < y) {
            return -1;
        }
        if (x > y) {
            return 1;
        }
        return 0;
    }
    static _search(partitions, hashValue) {
        for (let i = 0; i < partitions.length - 1; i++) {
            if (hashValue >= partitions[i].hashValue && hashValue < partitions[i + 1].hashValue) {
                return i;
            }
        }
        return partitions.length - 1;
    }
    static _throwIfInvalidNodes(nodes) {
        if (Array.isArray(nodes)) {
            return;
        }
        throw new Error("Invalid argument: 'nodes' has to be an array.");
    }
}
exports.ConsistentHashRing = ConsistentHashRing;
//# sourceMappingURL=consistentHashRing.js.map