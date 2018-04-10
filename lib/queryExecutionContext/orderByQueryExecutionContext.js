"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
class OrderByQueryExecutionContext extends _1.ParallelQueryExecutionContextBase {
    constructor(documentclient, collectionLink, query, options, partitionedQueryExecutionInfo) {
        super(documentclient, collectionLink, query, options, partitionedQueryExecutionInfo);
        this.orderByComparator = new _1.OrderByDocumentProducerComparator(this.sortOrders);
    }
    documentProducerComparator(docProd1, docProd2) {
        return this.orderByComparator.compare(docProd1, docProd2);
    }
}
exports.OrderByQueryExecutionContext = OrderByQueryExecutionContext;
//# sourceMappingURL=orderByQueryExecutionContext.js.map