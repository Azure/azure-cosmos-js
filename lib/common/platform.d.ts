export declare class Platform {
    static getPlatformDefaultHeaders(): {
        [key: string]: string;
    };
    static getDecodedDataLength(encodedData: string): number;
    static getUserAgent(): string;
    static _getSafeUserAgentSegmentInfo(s: string): string;
}
