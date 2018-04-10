export interface IHeaders {
    [key: string]: string | boolean | number;
}
export declare class HeaderUtils {
    static getRequestChargeIfAny(headers: IHeaders): number;
    static getInitialHeader(): IHeaders;
    static mergeHeaders(headers: IHeaders, toBeMergedHeaders: IHeaders): void;
}
