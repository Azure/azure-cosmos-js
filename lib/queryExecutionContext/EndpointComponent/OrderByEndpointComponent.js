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
class OrderByEndpointComponent {
    constructor(executionContext) {
        this.executionContext = executionContext;
    }
    nextItem() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { result: item, headers } = yield this.executionContext.nextItem();
                return { result: item !== undefined ? item.payload : undefined, headers };
            }
            catch (err) {
                throw err;
            }
        });
    }
    current() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { result: item, headers } = yield this.executionContext.current();
                return { result: item !== undefined ? item.payload : undefined, headers };
            }
            catch (err) {
                throw err;
            }
        });
    }
    hasMoreResults() {
        return this.executionContext.hasMoreResults();
    }
}
exports.OrderByEndpointComponent = OrderByEndpointComponent;
//# sourceMappingURL=OrderByEndpointComponent.js.map