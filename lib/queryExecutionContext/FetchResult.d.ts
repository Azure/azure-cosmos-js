export declare enum FetchResultType {
    "Done" = 0,
    "Exception" = 1,
    "Result" = 2,
}
export declare class FetchResult {
    feedResponse: any;
    fetchResultType: FetchResultType;
    error: any;
    constructor(feedResponse: any, error: any);
}
