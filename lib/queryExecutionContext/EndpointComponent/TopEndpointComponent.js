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
class TopEndpointComponent {
    constructor(executionContext, topCount) {
        this.executionContext = executionContext;
        this.topCount = topCount;
    }
    nextItem() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.topCount <= 0) {
                return { result: undefined, headers: undefined };
            }
            this.topCount--;
            try {
                return this.executionContext.nextItem();
            }
            catch (err) {
                throw err;
            }
        });
    }
    current() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.topCount <= 0) {
                return { result: undefined, headers: undefined };
            }
            try {
                return this.executionContext.current();
            }
            catch (err) {
                throw err;
            }
        });
    }
    hasMoreResults() {
        return (this.topCount > 0 && this.executionContext.hasMoreResults());
    }
}
exports.TopEndpointComponent = TopEndpointComponent;
//# sourceMappingURL=TopEndpointComponent.js.map