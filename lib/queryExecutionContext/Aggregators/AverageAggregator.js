"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AverageAggregator {
    aggregate(other) {
        if (other == null || other.sum == null) {
            return;
        }
        if (this.sum == null) {
            this.sum = 0.0;
            this.count = 0;
        }
        this.sum += other.sum;
        this.count += other.count;
    }
    getResult() {
        if (this.sum == null || this.count <= 0) {
            return undefined;
        }
        return this.sum / this.count;
    }
}
exports.AverageAggregator = AverageAggregator;
//# sourceMappingURL=AverageAggregator.js.map