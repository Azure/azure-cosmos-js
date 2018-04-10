"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BigInt = require("big-integer");
const base_1 = require("./base");
const common_1 = require("./common");
class SessionContainer {
    constructor(hostname, collectionNameToCollectionResourceId = {}, collectionResourceIdToSessionTokens = {}) {
        this.hostname = hostname;
        this.collectionNameToCollectionResourceId = collectionNameToCollectionResourceId;
        this.collectionResourceIdToSessionTokens = collectionResourceIdToSessionTokens;
        this.hostname = hostname;
    }
    getHostName() {
        return this.hostname;
    }
    getPartitionKeyRangeIdToTokenMap(request) {
        return this.getPartitionKeyRangeIdToTokenMapPrivate(request["isNameBased"], request["resourceId"], request["resourceAddress"]);
    }
    getPartitionKeyRangeIdToTokenMapPrivate(isNameBased, rId, resourceAddress) {
        let rangeIdToTokenMap = null;
        if (!isNameBased) {
            if (rId) {
                const resourceIdObject = new common_1.ResourceId();
                const resourceId = resourceIdObject.parse(rId);
                if (resourceId.documentCollection !== common_1.EMPTY) {
                    rangeIdToTokenMap =
                        this.collectionResourceIdToSessionTokens[resourceId.getUniqueDocumentCollectionId()];
                }
            }
        }
        else {
            resourceAddress = base_1.Base._trimSlashes(resourceAddress);
            const collectionName = base_1.Base.getCollectionLink(resourceAddress);
            if (collectionName && (collectionName in this.collectionNameToCollectionResourceId)) {
                rangeIdToTokenMap =
                    this.collectionResourceIdToSessionTokens[this.collectionNameToCollectionResourceId[collectionName]];
            }
        }
        return rangeIdToTokenMap;
    }
    resolveGlobalSessionToken(request) {
        if (!request) {
            throw new Error("request cannot be null");
        }
        return this.resolveGlobalSessionTokenPrivate(request["isNameBased"], request["resourceId"], request["resourceAddress"]);
    }
    resolveGlobalSessionTokenPrivate(isNameBased, rId, resourceAddress) {
        const rangeIdToTokenMap = this.getPartitionKeyRangeIdToTokenMapPrivate(isNameBased, rId, resourceAddress);
        if (rangeIdToTokenMap != null) {
            return this.getCombinedSessionToken(rangeIdToTokenMap);
        }
        return "";
    }
    clearToken(request) {
        let collectionResourceId;
        if (!request["isNameBased"]) {
            if (request["resourceId"]) {
                const resourceIdObject = new common_1.ResourceId();
                const resourceId = resourceIdObject.parse(request["resourceId"]);
                if (resourceId.documentCollection !== common_1.EMPTY) {
                    collectionResourceId = resourceId.getUniqueDocumentCollectionId();
                }
            }
        }
        else {
            const resourceAddress = base_1.Base._trimSlashes(request["resourceAddress"]);
            const collectionName = base_1.Base.getCollectionLink(resourceAddress);
            if (collectionName) {
                collectionResourceId = this.collectionNameToCollectionResourceId[collectionName];
                delete this.collectionNameToCollectionResourceId[collectionName];
            }
        }
        if (collectionResourceId !== undefined) {
            delete this.collectionResourceIdToSessionTokens[collectionResourceId];
        }
    }
    setSessionToken(request, reqHeaders, resHeaders) {
        if (resHeaders && !this.isReadingFromMaster(request["resourceType"], request["opearationType"])) {
            const sessionToken = resHeaders[common_1.Constants.HttpHeaders.SessionToken];
            if (sessionToken) {
                let ownerFullName = resHeaders[common_1.Constants.HttpHeaders.OwnerFullName];
                if (!ownerFullName) {
                    ownerFullName = base_1.Base._trimSlashes(request["resourceAddress"]);
                }
                const collectionName = base_1.Base.getCollectionLink(ownerFullName);
                const ownerId = !request["isNameBased"] ? request["resourceId"]
                    : resHeaders[common_1.Constants.HttpHeaders.OwnerId] || request["resourceId"];
                if (ownerId) {
                    const resourceIdObject = new common_1.ResourceId();
                    const resourceId = resourceIdObject.parse(ownerId);
                    if (resourceId.documentCollection !== common_1.EMPTY && collectionName) {
                        const uniqueDocumentCollectionId = resourceId.getUniqueDocumentCollectionId();
                        this.setSesisonTokenPrivate(uniqueDocumentCollectionId, collectionName, sessionToken);
                    }
                }
            }
        }
    }
    setSesisonTokenPrivate(collectionRid, collectionName, sessionToken) {
        if (!(collectionRid in this.collectionResourceIdToSessionTokens)) {
            this.collectionResourceIdToSessionTokens[collectionRid] = {};
        }
        this.compareAndSetToken(sessionToken, this.collectionResourceIdToSessionTokens[collectionRid]);
        if (!(collectionName in this.collectionNameToCollectionResourceId)) {
            this.collectionNameToCollectionResourceId[collectionName] = collectionRid;
        }
    }
    getCombinedSessionToken(tokens) {
        let result = "";
        if (tokens) {
            for (const index in tokens) {
                if (tokens.hasOwnProperty(index)) {
                    result = result + index + ":" + tokens[index] + ",";
                }
            }
        }
        return result.slice(0, -1);
    }
    compareAndSetToken(newToken, oldTokens) {
        if (newToken) {
            const newTokenParts = newToken.split(":");
            if (newTokenParts.length === 2) {
                const range = newTokenParts[0];
                const newLSN = BigInt(newTokenParts[1]);
                const success = false;
                const oldLSN = BigInt(oldTokens[range]);
                if (!oldLSN || oldLSN.lesser(newLSN)) {
                    oldTokens[range] = newLSN.toString();
                }
            }
        }
    }
    isReadingFromMaster(resourceType, operationType) {
        if (resourceType === "offers" ||
            resourceType === "dbs" ||
            resourceType === "users" ||
            resourceType === "permissions" ||
            resourceType === "topology" ||
            resourceType === "databaseaccount" ||
            resourceType === "pkranges" ||
            (resourceType === "colls"
                && (operationType === common_1.Constants.OperationTypes.Query))) {
            return true;
        }
        return false;
    }
}
exports.SessionContainer = SessionContainer;
//# sourceMappingURL=sessionContainer.js.map