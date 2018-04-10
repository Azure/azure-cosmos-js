"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const util = require("util");
const TYPEORDCOMPARATOR = Object.freeze({
    NoValue: {
        ord: 0,
    },
    undefined: {
        ord: 1,
    },
    boolean: {
        ord: 2,
        compFunc: (a, b) => {
            return (a === b ? 0 : (a > b ? 1 : -1));
        },
    },
    number: {
        ord: 4,
        compFunc: (a, b) => {
            return (a === b ? 0 : (a > b ? 1 : -1));
        },
    },
    string: {
        ord: 5,
        compFunc: (a, b) => {
            return (a === b ? 0 : (a > b ? 1 : -1));
        },
    },
});
class OrderByDocumentProducerComparator {
    constructor(sortOrder) {
        this.sortOrder = sortOrder;
    }
    targetPartitionKeyRangeDocProdComparator(docProd1, docProd2) {
        const a = docProd1.getTargetParitionKeyRange()["minInclusive"];
        const b = docProd2.getTargetParitionKeyRange()["minInclusive"];
        return (a === b ? 0 : (a > b ? 1 : -1));
    }
    compare(docProd1, docProd2) {
        if (docProd1.gotSplit()) {
            return -1;
        }
        if (docProd2.gotSplit()) {
            return 1;
        }
        const orderByItemsRes1 = this.getOrderByItems(docProd1.peekBufferedItems()[0]);
        const orderByItemsRes2 = this.getOrderByItems(docProd2.peekBufferedItems()[0]);
        this.validateOrderByItems(orderByItemsRes1, orderByItemsRes2);
        for (let i = 0; i < orderByItemsRes1.length; i++) {
            const compRes = this.compareOrderByItem(orderByItemsRes1[i], orderByItemsRes2[i]);
            if (compRes !== 0) {
                if (this.sortOrder[i] === "Ascending") {
                    return compRes;
                }
                else if (this.sortOrder[i] === "Descending") {
                    return -compRes;
                }
            }
        }
        return this.targetPartitionKeyRangeDocProdComparator(docProd1, docProd2);
    }
    compareValue(item1, type1, item2, type2) {
        const type1Ord = TYPEORDCOMPARATOR[type1].ord;
        const type2Ord = TYPEORDCOMPARATOR[type2].ord;
        const typeCmp = type1Ord - type2Ord;
        if (typeCmp !== 0) {
            return typeCmp;
        }
        if ((type1Ord === TYPEORDCOMPARATOR["undefined"].ord)
            || (type1Ord === TYPEORDCOMPARATOR["NoValue"].ord)) {
            return 0;
        }
        const compFunc = TYPEORDCOMPARATOR[type1].compFunc;
        assert.notEqual(compFunc, undefined, "cannot find the comparison function");
        return compFunc(item1, item2);
    }
    compareOrderByItem(orderByItem1, orderByItem2) {
        const type1 = this.getType(orderByItem1);
        const type2 = this.getType(orderByItem2);
        return this.compareValue(orderByItem1["item"], type1, orderByItem2["item"], type2);
    }
    validateOrderByItems(res1, res2) {
        this._throwIf(res1.length !== res2.length, util.format("Expected %s, but got %s.", res1.length, res2.length));
        this._throwIf(res1.length !== this.sortOrder.length, "orderByItems cannot have a different size than sort orders.");
        for (let i = 0; i < this.sortOrder.length; i++) {
            const type1 = this.getType(res1[i]);
            const type2 = this.getType(res2[i]);
            this._throwIf(type1 !== type2, util.format("Expected %s, but got %s.", type1, type2));
        }
    }
    getType(orderByItem) {
        if (orderByItem === undefined || orderByItem.item === undefined) {
            return "NoValue";
        }
        const type = typeof (orderByItem.item);
        this._throwIf(TYPEORDCOMPARATOR[type] === undefined, util.format("unrecognizable type %s", type));
        return type;
    }
    getOrderByItems(res) {
        return res["orderByItems"];
    }
    _throwIf(condition, msg) {
        if (condition) {
            throw Error(msg);
        }
    }
}
exports.OrderByDocumentProducerComparator = OrderByDocumentProducerComparator;
//# sourceMappingURL=orderByDocumentProducerComparator.js.map