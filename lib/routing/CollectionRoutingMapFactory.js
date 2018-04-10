"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("underscore");
const _1 = require(".");
const common_1 = require("../common");
class CollectionRoutingMapFactory {
    static createCompleteRoutingMap(partitionKeyRangeInfoTuppleList, collectionUniqueId) {
        const rangeById = {};
        const rangeByInfo = {};
        let sortedRanges = [];
        for (const r of partitionKeyRangeInfoTuppleList) {
            rangeById[r[0][common_1.Constants.PartitionKeyRange.Id]] = r;
            rangeByInfo[r[1]] = r[0];
            sortedRanges.push(r);
        }
        sortedRanges = _.sortBy(sortedRanges, (r) => {
            return r[0][common_1.Constants.PartitionKeyRange.MinInclusive];
        });
        const partitionKeyOrderedRange = sortedRanges.map((r) => r[0]);
        const orderedPartitionInfo = sortedRanges.map((r) => r[1]);
        if (!this._isCompleteSetOfRange(partitionKeyOrderedRange)) {
            return undefined;
        }
        return new _1.InMemoryCollectionRoutingMap(rangeById, rangeByInfo, partitionKeyOrderedRange, orderedPartitionInfo, collectionUniqueId);
    }
    static _isCompleteSetOfRange(partitionKeyOrderedRange) {
        let isComplete = false;
        if (partitionKeyOrderedRange.length > 0) {
            const firstRange = partitionKeyOrderedRange[0];
            const lastRange = partitionKeyOrderedRange[partitionKeyOrderedRange.length - 1];
            isComplete = (firstRange[common_1.Constants.PartitionKeyRange.MinInclusive] ===
                common_1.Constants.EffectiveParitionKeyConstants.MinimumInclusiveEffectivePartitionKey);
            isComplete = isComplete && (lastRange[common_1.Constants.PartitionKeyRange.MaxExclusive] ===
                common_1.Constants.EffectiveParitionKeyConstants.MaximumExclusiveEffectivePartitionKey);
            for (let i = 1; i < partitionKeyOrderedRange.length; i++) {
                const previousRange = partitionKeyOrderedRange[i - 1];
                const currentRange = partitionKeyOrderedRange[i];
                isComplete = isComplete && (previousRange[common_1.Constants.PartitionKeyRange.MaxExclusive] ===
                    currentRange[common_1.Constants.PartitionKeyRange.MinInclusive]);
                if (!isComplete) {
                    if (previousRange[common_1.Constants.PartitionKeyRange.MaxExclusive] >
                        currentRange[common_1.Constants.PartitionKeyRange.MinInclusive]) {
                        throw Error("Ranges overlap");
                    }
                    break;
                }
            }
        }
        return isComplete;
    }
}
exports.CollectionRoutingMapFactory = CollectionRoutingMapFactory;
//# sourceMappingURL=CollectionRoutingMapFactory.js.map