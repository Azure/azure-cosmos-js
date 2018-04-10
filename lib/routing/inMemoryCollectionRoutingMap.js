"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const bs = require("binary-search-bounds");
const common_1 = require("../common");
const QueryRange_1 = require("./QueryRange");
class InMemoryCollectionRoutingMap {
    constructor(rangeById, rangeByInfo, orderedPartitionKeyRanges, orderedPartitionInfo, collectionUniqueId) {
        this.rangeById = rangeById;
        this.rangeByInfo = rangeByInfo;
        this.orderedPartitionKeyRanges = orderedPartitionKeyRanges;
        this.orderedRanges = orderedPartitionKeyRanges.map((pkr) => {
            return new QueryRange_1.QueryRange(pkr[common_1.Constants.PartitionKeyRange.MinInclusive], pkr[common_1.Constants.PartitionKeyRange.MaxExclusive], true, false);
        });
        this.orderedPartitionInfo = orderedPartitionInfo;
        this.collectionUniqueId = collectionUniqueId;
    }
    getOrderedParitionKeyRanges() {
        return this.orderedPartitionKeyRanges;
    }
    getRangeByEffectivePartitionKey(effectivePartitionKeyValue) {
        if (common_1.Constants.EffectiveParitionKeyConstants.MinimumInclusiveEffectivePartitionKey ===
            effectivePartitionKeyValue) {
            return this.orderedPartitionKeyRanges[0];
        }
        if (common_1.Constants.EffectiveParitionKeyConstants.MaximumExclusiveEffectivePartitionKey ===
            effectivePartitionKeyValue) {
            return undefined;
        }
        const sortedLow = this.orderedRanges.map((r) => {
            return { v: r.min, b: !r.isMinInclusive };
        });
        const index = bs.le(sortedLow, { v: effectivePartitionKeyValue, b: true }, InMemoryCollectionRoutingMap._vbCompareFunction);
        assert.ok(index >= 0, "error in collection routing map, queried partition key is less than the start range.");
        return this.orderedPartitionKeyRanges[index];
    }
    static _vbCompareFunction(x, y) {
        if (x.v > y.v) {
            return 1;
        }
        if (x.v < y.v) {
            return -1;
        }
        if (x.b > y.b) {
            return 1;
        }
        if (x.b < y.b) {
            return -1;
        }
        return 0;
    }
    getRangeByPartitionKeyRangeId(partitionKeyRangeId) {
        const t = this.rangeById[partitionKeyRangeId];
        if (t === undefined) {
            return undefined;
        }
        return t[0];
    }
    getOverlappingRanges(providedQueryRanges) {
        const pqr = Array.isArray(providedQueryRanges) ? providedQueryRanges : [providedQueryRanges];
        const minToPartitionRange = {};
        const sortedLow = this.orderedRanges.map((r) => {
            return { v: r.min, b: !r.isMinInclusive };
        });
        const sortedHigh = this.orderedRanges.map((r) => {
            return { v: r.max, b: r.isMaxInclusive };
        });
        for (const queryRange of pqr) {
            if (queryRange.isEmpty()) {
                continue;
            }
            const minIndex = bs.le(sortedLow, { v: queryRange.min, b: !queryRange.isMinInclusive }, InMemoryCollectionRoutingMap._vbCompareFunction);
            assert.ok(minIndex >= 0, "error in collection routing map, queried value is less than the start range.");
            const maxIndex = bs.ge(sortedHigh, { v: queryRange.max, b: queryRange.isMaxInclusive }, InMemoryCollectionRoutingMap._vbCompareFunction);
            assert.ok(maxIndex < sortedHigh.length, "error in collection routing map, queried value is greater than the end range.");
            for (let j = minIndex; j < maxIndex + 1; j++) {
                if (queryRange.overlaps(this.orderedRanges[j])) {
                    minToPartitionRange[this.orderedPartitionKeyRanges[j][common_1.Constants.PartitionKeyRange.MinInclusive]] =
                        this.orderedPartitionKeyRanges[j];
                }
            }
        }
        const overlappingPartitionKeyRanges = Object.keys(minToPartitionRange)
            .map((k) => minToPartitionRange[k]);
        return overlappingPartitionKeyRanges.sort((r) => {
            return r[common_1.Constants.PartitionKeyRange.MinInclusive];
        });
    }
}
exports.InMemoryCollectionRoutingMap = InMemoryCollectionRoutingMap;
//# sourceMappingURL=inMemoryCollectionRoutingMap.js.map