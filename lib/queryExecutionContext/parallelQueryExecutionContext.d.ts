import { DocumentProducer, IExecutionContext, ParallelQueryExecutionContextBase, PartitionedQueryExecutionContextInfo } from ".";
import { DocumentClient } from "../documentclient";
export declare class ParallelQueryExecutionContext extends ParallelQueryExecutionContextBase implements IExecutionContext {
    constructor(documentclient: DocumentClient, collectionLink: string, query: any, options: any, partitionedQueryExecutionInfo: PartitionedQueryExecutionContextInfo);
    documentProducerComparator(docProd1: DocumentProducer, docProd2: DocumentProducer): 0 | 1 | -1;
    private _buildContinuationTokenFrom(documentProducer);
}
