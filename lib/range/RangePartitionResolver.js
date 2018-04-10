"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
class RangePartitionResolver {
    constructor(partitionKeyExtractor, partitionKeyMap, compareFunction) {
        if (partitionKeyExtractor === undefined || partitionKeyExtractor === null) {
            throw new Error("partitionKeyExtractor cannot be null or undefined");
        }
        if (typeof partitionKeyExtractor !== "string" && typeof partitionKeyExtractor !== "function") {
            throw new Error("partitionKeyExtractor must be either a 'string' or a 'function'");
        }
        if (partitionKeyMap === undefined || partitionKeyMap === null) {
            throw new Error("partitionKeyMap cannot be null or undefined");
        }
        if (!(Array.isArray(partitionKeyMap))) {
            throw new Error("partitionKeyMap has to be an Array");
        }
        const allMapEntriesAreValid = partitionKeyMap.every((m) => {
            if ((m === undefined) || m === null) {
                return false;
            }
            if (m.range === undefined) {
                return false;
            }
            if (!(m.range instanceof _1.Range)) {
                return false;
            }
            if (m.link === undefined) {
                return false;
            }
            if (typeof m.link !== "string") {
                return false;
            }
            return true;
        });
        if (!allMapEntriesAreValid) {
            throw new Error("All partitionKeyMap entries have to be a tuple {range: Range, link: string }");
        }
        if (compareFunction !== undefined && typeof compareFunction !== "function") {
            throw new Error("Invalid argument: 'compareFunction' is not a function");
        }
        this.partitionKeyExtractor = partitionKeyExtractor;
        this.partitionKeyMap = partitionKeyMap;
        this.compareFunction = compareFunction;
    }
    getPartitionKey(document) {
        if (typeof this.partitionKeyExtractor === "string") {
            return document[this.partitionKeyExtractor];
        }
        if (typeof this.partitionKeyExtractor === "function") {
            return this.partitionKeyExtractor(document);
        }
        throw new Error(`Unable to extract partition key from document. \
            Ensure PartitionKeyExtractor is a valid function or property name.`);
    }
    resolveForCreate(partitionKey) {
        const range = new _1.Range({ low: partitionKey });
        const mapEntry = this._getFirstContainingMapEntryOrNull(range);
        if (mapEntry !== undefined && mapEntry !== null) {
            return mapEntry.link;
        }
        throw new Error(`Invalid operation: A containing range for \
            ${range.toString()} doesn't exist in the partition map.`);
    }
    resolveForRead(partitionKey) {
        if (partitionKey === undefined || partitionKey === null) {
            return this.partitionKeyMap.map((i) => i.link);
        }
        else {
            return this._getIntersectingMapEntries(partitionKey).map((i) => i.link);
        }
    }
    _getFirstContainingMapEntryOrNull(point) {
        const containingMapEntries = this.partitionKeyMap
            .filter((p) => p.range !== undefined && p.range.contains(point, this.compareFunction));
        if (containingMapEntries && containingMapEntries.length > 0) {
            return containingMapEntries[0];
        }
        return null;
    }
    _getIntersectingMapEntries(partitionKey) {
        const partitionKeys = (Array.isArray(partitionKey)) ? partitionKey : [partitionKey];
        const ranges = partitionKeys.map((p) => _1.Range.isRange(p)
            ? p
            : new _1.Range({ low: p }));
        return ranges.reduce((result, range) => {
            return result.concat(this.partitionKeyMap
                .filter((entry) => entry.range.intersect(range, this.compareFunction)));
        }, []);
    }
}
exports.RangePartitionResolver = RangePartitionResolver;
//# sourceMappingURL=RangePartitionResolver.js.map