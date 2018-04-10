import { DocumentClientBase } from "./DocumentClientBase";
import { IHeaders } from "./queryExecutionContext";
export interface IRequestInfo {
    [index: string]: any;
    verb: string;
    path: string;
    resourceId: string;
    resourceType: string;
    headers: IHeaders;
}
export interface ITokenProvider {
    getToken: (requestInfo: IRequestInfo, callback?: (err: Error, token: string) => void) => Promise<string>;
}
export declare class AuthHandler {
    static getAuthorizationHeader(documentClient: DocumentClientBase, verb: string, path: string, resourceId: string, resourceType: string, headers: IHeaders): Promise<string>;
    private static getAuthorizationTokenUsingMasterKey(verb, resourceId, resourceType, headers, masterKey);
    private static getAuthorizationTokenUsingResourceTokens(resourceTokens, path, resourceId);
    private static getAuthorizationTokenUsingTokenProvider(tokenProvider, requestInfo);
}
