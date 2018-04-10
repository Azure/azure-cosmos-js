import { DocumentProducer, IExecutionContext, ParallelQueryExecutionContextBase, PartitionedQueryExecutionContextInfo } from ".";
import { DocumentClient } from "../documentclient";
export declare class OrderByQueryExecutionContext extends ParallelQueryExecutionContextBase implements IExecutionContext {
    private orderByComparator;
    constructor(documentclient: DocumentClient, collectionLink: string, query: any, options: any, partitionedQueryExecutionInfo: PartitionedQueryExecutionContextInfo);
    documentProducerComparator(docProd1: DocumentProducer, docProd2: DocumentProducer): any;
}
