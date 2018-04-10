"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const orderByDocumentProducerComparator_1 = require("../orderByDocumentProducerComparator");
class MaxAggregator {
    constructor() {
        this.value = undefined;
        this.comparer = new orderByDocumentProducerComparator_1.OrderByDocumentProducerComparator(["Ascending"]);
    }
    aggregate(other) {
        if (this.value === undefined) {
            this.value = other;
        }
        else if (this.comparer.compareValue(other, typeof (other), this.value, typeof (this.value)) > 0) {
            this.value = other;
        }
    }
    getResult() {
        return this.value;
    }
}
exports.MaxAggregator = MaxAggregator;
//# sourceMappingURL=MaxAggregator.js.map