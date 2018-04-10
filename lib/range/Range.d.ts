export declare type CompareFunction = (x: string, y: string) => number;
export declare class Range {
    readonly low: string;
    readonly high: string;
    constructor(options: any);
    private _compare(x, y, compareFunction?);
    contains(other: string | Range, compareFunction?: CompareFunction): boolean;
    private _containsPoint(point, compareFunction?);
    private _containsRange(range, compareFunction?);
    intersect(range: Range, compareFunction?: CompareFunction): boolean;
    toString(): string;
    static isRange(pointOrRange: string | Range): boolean;
}
