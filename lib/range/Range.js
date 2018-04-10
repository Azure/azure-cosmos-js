"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Range {
    constructor(options) {
        if (options === undefined) {
            options = {};
        }
        if (options === null) {
            throw new Error("Invalid argument: 'options' is null");
        }
        if (typeof options !== "object") {
            throw new Error("Invalid argument: 'options' is not an object");
        }
        if (options.high === undefined) {
            options.high = options.low;
        }
        this.low = options.low;
        this.high = options.high;
    }
    _compare(x, y, compareFunction) {
        if (x === undefined && y === undefined) {
            return 0;
        }
        if (x === undefined) {
            return 1;
        }
        if (y === undefined) {
            return -1;
        }
        if (compareFunction !== undefined) {
            const v = Number(compareFunction(x, y));
            if (Number.isNaN(v)) {
                return 0;
            }
            return v;
        }
        const xString = String(x);
        const yString = String(y);
        if (xString < yString) {
            return -1;
        }
        if (xString > yString) {
            return 1;
        }
        return 0;
    }
    contains(other, compareFunction) {
        if (Range.isRange(other)) {
            return this._containsRange(other, compareFunction);
        }
        else {
            return this._containsPoint(other, compareFunction);
        }
    }
    _containsPoint(point, compareFunction) {
        return this._compare(point, this.low, compareFunction) >= 0
            && this._compare(point, this.high, compareFunction) <= 0;
    }
    _containsRange(range, compareFunction) {
        return this._compare(range.low, this.low, compareFunction) >= 0
            && this._compare(range.high, this.high, compareFunction) <= 0;
    }
    intersect(range, compareFunction) {
        if (range === undefined || range === null) {
            throw new Error("Invalid Argument: 'other' is undefined or null");
        }
        const maxLow = this._compare(this.low, range.low, compareFunction) >= 0 ? this.low : range.low;
        const minHigh = this._compare(this.high, range.high, compareFunction) <= 0 ? this.high : range.high;
        return this._compare(maxLow, minHigh, compareFunction) <= 0;
    }
    toString() {
        return String(this.low) + "," + String(this.high);
    }
    static isRange(pointOrRange) {
        if (pointOrRange === undefined) {
            return false;
        }
        if (pointOrRange === null) {
            return false;
        }
        if (typeof pointOrRange !== "object") {
            return false;
        }
        return pointOrRange instanceof Range;
    }
}
exports.Range = Range;
//# sourceMappingURL=Range.js.map