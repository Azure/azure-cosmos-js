"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CountAggregator {
    constructor() {
        this.value = 0;
    }
    aggregate(other) {
        this.value += other;
    }
    getResult() {
        return this.value;
    }
}
exports.CountAggregator = CountAggregator;
//# sourceMappingURL=CountAggregator.js.map