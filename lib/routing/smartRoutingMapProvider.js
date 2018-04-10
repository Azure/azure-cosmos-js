"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const common_1 = require("../common");
const _1 = require("./");
exports.PARITIONKEYRANGE = common_1.Constants.PartitionKeyRange;
class SmartRoutingMapProvider {
    constructor(documentclient) {
        this.partitionKeyRangeCache = new _1.PartitionKeyRangeCache(documentclient);
    }
    static _secondRangeIsAfterFirstRange(range1, range2) {
        assert.notEqual(range1.max, undefined, "invalid arg");
        assert.notEqual(range2.min, undefined, "invalid arg");
        if (range1.max > range2.min) {
            return false;
        }
        else {
            if (range1.max === range2.min && range1.isMaxInclusive && range2.isMinInclusive) {
                return false;
            }
            return true;
        }
    }
    static _isSortedAndNonOverlapping(ranges) {
        for (let idx = 1; idx < ranges.length; idx++) {
            const previousR = ranges[idx - 1];
            const r = ranges[idx];
            if (!this._secondRangeIsAfterFirstRange(previousR, r)) {
                return false;
            }
        }
        return true;
    }
    static _stringMax(a, b) {
        return (a >= b ? a : b);
    }
    static _stringCompare(a, b) {
        return (a === b ? 0 : (a > b ? 1 : -1));
    }
    static _subtractRange(r, partitionKeyRange) {
        const left = this._stringMax(partitionKeyRange[exports.PARITIONKEYRANGE.MaxExclusive], r.min);
        const leftInclusive = this._stringCompare(left, r.min) === 0 ? r.isMinInclusive : false;
        return new _1.QueryRange(left, r.max, leftInclusive, r.isMaxInclusive);
    }
    getOverlappingRanges(collectionLink, sortedRanges) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!SmartRoutingMapProvider._isSortedAndNonOverlapping(sortedRanges)) {
                throw new Error("the list of ranges is not a non-overlapping sorted ranges");
            }
            let partitionKeyRanges = [];
            if (sortedRanges.length === 0) {
                return partitionKeyRanges;
            }
            const collectionRoutingMap = yield this.partitionKeyRangeCache.onCollectionRoutingMap(collectionLink);
            let index = 0;
            let currentProvidedRange = sortedRanges[index];
            while (true) {
                if (currentProvidedRange.isEmpty()) {
                    if (++index >= sortedRanges.length) {
                        return partitionKeyRanges;
                    }
                    currentProvidedRange = sortedRanges[index];
                    continue;
                }
                let queryRange;
                if (partitionKeyRanges.length > 0) {
                    queryRange = SmartRoutingMapProvider._subtractRange(currentProvidedRange, partitionKeyRanges[partitionKeyRanges.length - 1]);
                }
                else {
                    queryRange = currentProvidedRange;
                }
                const overlappingRanges = collectionRoutingMap.getOverlappingRanges(queryRange);
                assert.ok(overlappingRanges.length > 0, `error: returned overlapping ranges for queryRange ${queryRange} is empty`);
                partitionKeyRanges = partitionKeyRanges.concat(overlappingRanges);
                const lastKnownTargetRange = _1.QueryRange.parsePartitionKeyRange(partitionKeyRanges[partitionKeyRanges.length - 1]);
                assert.notEqual(lastKnownTargetRange, undefined);
                assert.ok(SmartRoutingMapProvider._stringCompare(currentProvidedRange.max, lastKnownTargetRange.max) <= 0, `error: returned overlapping ranges ${overlappingRanges} \
                    does not contain the requested range ${queryRange}`);
                if (++index >= sortedRanges.length) {
                    return partitionKeyRanges;
                }
                currentProvidedRange = sortedRanges[index];
                while (SmartRoutingMapProvider._stringCompare(currentProvidedRange.max, lastKnownTargetRange.max) <= 0) {
                    if (++index >= sortedRanges.length) {
                        return partitionKeyRanges;
                    }
                    currentProvidedRange = sortedRanges[index];
                }
            }
        });
    }
}
exports.SmartRoutingMapProvider = SmartRoutingMapProvider;
//# sourceMappingURL=smartRoutingMapProvider.js.map