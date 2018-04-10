import { Options } from "./documentclient";
import { DocumentClientBase } from "./DocumentClientBase";
import { IHeaders } from "./queryExecutionContext";
import { Response } from "./request";
export declare class Base {
    static extend(arg0: any, arg1: any): any;
    static map(arg0: any, arg1: any): any;
    static NotImplementedException: string;
    static jsonStringifyAndEscapeNonASCII(arg: any): string;
    static getHeaders(documentClient: DocumentClientBase, defaultHeaders: IHeaders, verb: string, path: string, resourceId: string, resourceType: string, options: Options, partitionKeyRangeId?: string): Promise<IHeaders>;
    static parseLink(resourcePath: string): {
        type: string;
        objectBody: {
            id: string;
            self: string;
        };
    };
    static parsePath(path: string): string[];
    static getDatabaseLink(link: string): string;
    static getCollectionLink(link: string): string;
    static getAttachmentIdFromMediaId(mediaId: string): string;
    static getHexaDigit(): string;
    static generateGuidId(): string;
    static isLinkNameBased(link: string): boolean;
    static _trimSlashes(source: string): string;
    static _isValidCollectionLink(link: string): boolean;
    static ThrowOrCallback(callback: ResponseCallback<any>, err: any): void;
    static ResponseOrCallback(callback: ResponseCallback<any>, value: Response<any>): Response<any>;
}
export declare type ResponseCallback<T> = (err: any, result?: T, headers?: IHeaders) => void;
