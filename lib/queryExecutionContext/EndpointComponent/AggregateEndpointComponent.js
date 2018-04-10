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
const Aggregators_1 = require("../Aggregators");
class AggregateEndpointComponent {
    constructor(executionContext, aggregateOperators) {
        this.executionContext = executionContext;
        this.executionContext = executionContext;
        this.localAggregators = [];
        aggregateOperators.forEach((aggregateOperator) => {
            switch (aggregateOperator) {
                case "Average":
                    this.localAggregators.push(new Aggregators_1.AverageAggregator());
                    break;
                case "Count":
                    this.localAggregators.push(new Aggregators_1.CountAggregator());
                    break;
                case "Max":
                    this.localAggregators.push(new Aggregators_1.MaxAggregator());
                    break;
                case "Min":
                    this.localAggregators.push(new Aggregators_1.MinAggregator());
                    break;
                case "Sum":
                    this.localAggregators.push(new Aggregators_1.SumAggregator());
                    break;
            }
        });
    }
    _getAggregateResult() {
        return __awaiter(this, void 0, void 0, function* () {
            this.toArrayTempResources = [];
            this.aggregateValues = [];
            this.aggregateValuesIndex = -1;
            try {
                const { result: resources, headers } = yield this._getQueryResults();
                resources.forEach((resource) => {
                    this.localAggregators.forEach((aggregator) => {
                        let itemValue;
                        if (resource && Object.keys(resource).length > 0) {
                            const key = Object.keys(resource)[0];
                            itemValue = resource[key];
                        }
                        aggregator.aggregate(itemValue);
                    });
                });
                this.localAggregators.forEach((aggregator) => {
                    this.aggregateValues.push(aggregator.getResult());
                });
                return { result: this.aggregateValues, headers };
            }
            catch (err) {
                throw err;
            }
        });
    }
    _getQueryResults() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { result: item, headers } = yield this.executionContext.nextItem();
                if (item === undefined) {
                    return { result: this.toArrayTempResources, headers };
                }
                this.toArrayTempResources = this.toArrayTempResources.concat(item);
                return this._getQueryResults();
            }
            catch (err) {
                throw err;
            }
        });
    }
    nextItem() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resHeaders;
                let resources;
                if (this.aggregateValues === undefined) {
                    ({ result: resources, headers: resHeaders } = yield this._getAggregateResult());
                }
                const resource = this.aggregateValuesIndex < this.aggregateValues.length
                    ? this.aggregateValues[++this.aggregateValuesIndex]
                    : undefined;
                return { result: resource, headers: resHeaders };
            }
            catch (err) {
                throw err;
            }
        });
    }
    current() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.aggregateValues === undefined) {
                const { result: resouces, headers } = yield this._getAggregateResult();
                return { result: this.aggregateValues[this.aggregateValuesIndex], headers };
            }
            else {
                return { result: this.aggregateValues[this.aggregateValuesIndex], headers: undefined };
            }
        });
    }
    hasMoreResults() {
        return this.aggregateValues != null && this.aggregateValuesIndex < this.aggregateValues.length - 1;
    }
}
exports.AggregateEndpointComponent = AggregateEndpointComponent;
//# sourceMappingURL=AggregateEndpointComponent.js.map