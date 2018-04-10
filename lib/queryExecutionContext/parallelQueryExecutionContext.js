"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const routing_1 = require("../routing");
class ParallelQueryExecutionContext extends _1.ParallelQueryExecutionContextBase {
    constructor(documentclient, collectionLink, query, options, partitionedQueryExecutionInfo) {
        super(documentclient, collectionLink, query, options, partitionedQueryExecutionInfo);
    }
    documentProducerComparator(docProd1, docProd2) {
        const a = docProd1.getTargetParitionKeyRange()["minInclusive"];
        const b = docProd2.getTargetParitionKeyRange()["minInclusive"];
        return (a === b ? 0 : (a > b ? 1 : -1));
    }
    _buildContinuationTokenFrom(documentProducer) {
        if (documentProducer.allFetched && documentProducer.peekBufferedItems().length === 0) {
            return undefined;
        }
        const min = documentProducer.targetPartitionKeyRange[routing_1.PARITIONKEYRANGE.MinInclusive];
        const max = documentProducer.targetPartitionKeyRange[routing_1.PARITIONKEYRANGE.MaxExclusive];
        const range = {
            min,
            max,
            id: documentProducer.targetPartitionKeyRange.id,
        };
        const withNullDefault = (token) => {
            if (token) {
                return token;
            }
            else if (token === null || token === undefined) {
                return null;
            }
        };
        const documentProducerContinuationToken = documentProducer.peekBufferedItems().length > 0
            ? documentProducer.previousContinuationToken
            : documentProducer.continuationToken;
        return {
            token: withNullDefault(documentProducerContinuationToken),
            range,
        };
    }
}
exports.ParallelQueryExecutionContext = ParallelQueryExecutionContext;
//# sourceMappingURL=parallelQueryExecutionContext.js.map