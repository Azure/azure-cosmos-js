"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SumAggregator {
    aggregate(other) {
        if (other === undefined) {
            return;
        }
        if (this.sum === undefined) {
            this.sum = other;
        }
        else {
            this.sum += other;
        }
    }
    getResult() {
        return this.sum;
    }
}
exports.SumAggregator = SumAggregator;
//# sourceMappingURL=SumAggregator.js.map