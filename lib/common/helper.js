"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const Regexes = _1.Constants.RegularExpressions;
class Helper {
    static isStringNullOrEmpty(inputString) {
        return !inputString || /^\s*$/.test(inputString);
    }
    static trimSlashFromLeftAndRight(inputString) {
        if (typeof inputString !== "string") {
            throw new Error("invalid input: input is not string");
        }
        return inputString.replace(Regexes.TrimLeftSlashes, "").replace(Regexes.TrimRightSlashes, "");
    }
    static validateResourceId(resourceId) {
        if (typeof resourceId !== "string" || this.isStringNullOrEmpty(resourceId)) {
            throw new Error("Resource Id must be a string and cannot be undefined, null or empty");
        }
        if (resourceId[resourceId.length - 1] === " ") {
            throw new Error("Resource Id cannot end with space");
        }
        if (Regexes.IllegalResourceIdCharacters.test(resourceId)) {
            throw new Error("Illegal characters ['/', '\\', '?', '#'] cannot be used in resourceId");
        }
        return true;
    }
    static getResourceIdFromPath(resourcePath) {
        if (!resourcePath || typeof resourcePath !== "string") {
            return null;
        }
        const trimmedPath = this.trimSlashFromLeftAndRight(resourcePath);
        const pathSegments = trimmedPath.split("/");
        if (pathSegments.length % 2 !== 0) {
            return null;
        }
        return pathSegments[pathSegments.length - 1];
    }
}
exports.Helper = Helper;
//# sourceMappingURL=helper.js.map