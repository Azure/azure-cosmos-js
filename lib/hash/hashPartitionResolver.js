"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
const consistentHashRing_1 = require("./consistentHashRing");
class HashPartitionResolver {
    constructor(partitionKeyExtractor, collectionLinks, options) {
        HashPartitionResolver._throwIfInvalidPartitionKeyExtractor(partitionKeyExtractor);
        HashPartitionResolver._throwIfInvalidCollectionLinks(collectionLinks);
        this.partitionKeyExtractor = partitionKeyExtractor;
        options = options || {};
        this.consistentHashRing = new consistentHashRing_1.ConsistentHashRing(collectionLinks, options);
        this.collectionLinks = collectionLinks;
    }
    getPartitionKey(document) {
        return (typeof this.partitionKeyExtractor === "string")
            ? document[this.partitionKeyExtractor]
            : this.partitionKeyExtractor(document);
    }
    resolveForRead(partitionKey) {
        if (partitionKey === undefined || partitionKey === null) {
            return this.collectionLinks;
        }
        return [this._resolve(partitionKey)];
    }
    resolveForCreate(partitionKey) {
        return this._resolve(partitionKey);
    }
    _resolve(partitionKey) {
        HashPartitionResolver._throwIfInvalidPartitionKey(partitionKey);
        return this.consistentHashRing.getNode(partitionKey);
    }
    static _throwIfInvalidPartitionKeyExtractor(partitionKeyExtractor) {
        if (partitionKeyExtractor === undefined || partitionKeyExtractor === null) {
            throw new Error("partitionKeyExtractor cannot be null or undefined");
        }
        if (typeof partitionKeyExtractor !== "string" && typeof partitionKeyExtractor !== "function") {
            throw new Error("partitionKeyExtractor must be either a 'string' or a 'function'");
        }
    }
    static _throwIfInvalidPartitionKey(partitionKey) {
        const partitionKeyType = typeof partitionKey;
        if (partitionKeyType !== "string") {
            throw new Error("partitionKey must be a 'string'");
        }
    }
    static _throwIfInvalidCollectionLinks(collectionLinks) {
        if (!Array.isArray(collectionLinks)) {
            throw new Error("collectionLinks must be an array.");
        }
        if (collectionLinks.some((collectionLink) => !base_1.Base._isValidCollectionLink(collectionLink))) {
            throw new Error("All elements of collectionLinks must be collection links.");
        }
    }
}
exports.HashPartitionResolver = HashPartitionResolver;
//# sourceMappingURL=hashPartitionResolver.js.map