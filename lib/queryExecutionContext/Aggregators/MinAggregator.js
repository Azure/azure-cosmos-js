"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const orderByDocumentProducerComparator_1 = require("../orderByDocumentProducerComparator");
class MinAggregator {
    constructor() {
        this.value = undefined;
        this.comparer = new orderByDocumentProducerComparator_1.OrderByDocumentProducerComparator(["Ascending"]);
    }
    aggregate(other) {
        if (this.value === undefined) {
            this.value = other;
        }
        else {
            const otherType = other == null ? "NoValue" : typeof (other);
            if (this.comparer.compareValue(other, otherType, this.value, typeof (this.value)) < 0) {
                this.value = other;
            }
        }
    }
    getResult() {
        return this.value;
    }
}
exports.MinAggregator = MinAggregator;
//# sourceMappingURL=MinAggregator.js.map