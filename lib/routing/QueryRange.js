"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../common");
class QueryRange {
    constructor(rangeMin, rangeMax, isMinInclusive, isMaxInclusive) {
        this.min = rangeMin;
        this.max = rangeMax;
        this.isMinInclusive = isMinInclusive;
        this.isMaxInclusive = isMaxInclusive;
    }
    overlaps(other) {
        const range1 = this;
        const range2 = other;
        if (range1 === undefined || range2 === undefined) {
            return false;
        }
        if (range1.isEmpty() || range2.isEmpty()) {
            return false;
        }
        if (range1.min <= range2.max || range2.min <= range1.max) {
            if ((range1.min === range2.max && !(range1.isMinInclusive && range2.isMaxInclusive))
                || (range2.min === range1.max && !(range2.isMinInclusive && range1.isMaxInclusive))) {
                return false;
            }
            return true;
        }
        return false;
    }
    isEmpty() {
        return (!(this.isMinInclusive && this.isMaxInclusive)) && this.min === this.max;
    }
    static parsePartitionKeyRange(partitionKeyRange) {
        return new QueryRange(partitionKeyRange[common_1.Constants.PartitionKeyRange.MinInclusive], partitionKeyRange[common_1.Constants.PartitionKeyRange.MaxExclusive], true, false);
    }
    static parseFromDict(queryRangeDict) {
        return new QueryRange(queryRangeDict.min, queryRangeDict.max, queryRangeDict.isMinInclusive, queryRangeDict.isMaxInclusive);
    }
}
exports.QueryRange = QueryRange;
//# sourceMappingURL=QueryRange.js.map