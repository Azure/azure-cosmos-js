import { DocumentProducer } from "./documentProducer";
export declare class OrderByDocumentProducerComparator {
    sortOrder: string[];
    constructor(sortOrder: string[]);
    targetPartitionKeyRangeDocProdComparator(docProd1: DocumentProducer, docProd2: DocumentProducer): 0 | 1 | -1;
    compare(docProd1: DocumentProducer, docProd2: DocumentProducer): number;
    compareValue(item1: any, type1: string, item2: any, type2: string): number;
    compareOrderByItem(orderByItem1: any, orderByItem2: any): number;
    validateOrderByItems(res1: string[], res2: string[]): void;
    getType(orderByItem: any): "string" | "number" | "boolean" | "symbol" | "undefined" | "object" | "function" | "NoValue";
    getOrderByItems(res: any): any;
    _throwIf(condition: boolean, msg: string): void;
}
