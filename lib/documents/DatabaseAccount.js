"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DatabaseAccount {
    constructor() {
        this._writableLocations = [];
        this._readableLocations = [];
    }
    get WritableLocations() {
        return this._writableLocations;
    }
    get ReadableLocations() {
        return this._readableLocations;
    }
}
exports.DatabaseAccount = DatabaseAccount;
//# sourceMappingURL=DatabaseAccount.js.map