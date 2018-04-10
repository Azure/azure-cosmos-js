"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BigInt = require("big-integer");
const int64_buffer_1 = require("int64-buffer");
exports.EMPTY = "0";
class ResourceId {
    constructor() {
        this.offer = exports.EMPTY;
        this.database = exports.EMPTY;
        this.documentCollection = exports.EMPTY;
        this.storedProcedure = exports.EMPTY;
        this.trigger = exports.EMPTY;
        this.userDefinedFunction = exports.EMPTY;
        this.document = exports.EMPTY;
        this.partitionKeyRange = exports.EMPTY;
        this.user = exports.EMPTY;
        this.conflict = exports.EMPTY;
        this.permission = exports.EMPTY;
        this.attachment = exports.EMPTY;
        this.length = 20;
        this.offerIdLength = 3;
        this.DocumentByte = 0;
        this.StoredProcedureByte = 8;
        this.TriggerByte = 7;
        this.UserDefinedFunctionByte = 6;
        this.ConflictByte = 4;
        this.PartitionKeyRangeByte = 5;
    }
    parse(id) {
        const pair = this.tryParse(id);
        if (!pair[0]) {
            throw (new Error("invalid resource id " + id));
        }
        return pair[1];
    }
    newDatabaseId(dbId) {
        const resourceId = new ResourceId();
        resourceId.database = dbId;
        return ResourceId;
    }
    newDocumentCollectionId(databaseId, collectionId) {
        const dbId = this.parse(databaseId);
        const collectionResourceId = new ResourceId();
        collectionResourceId.database = dbId.database;
        collectionResourceId.documentCollection = collectionId;
        return collectionResourceId;
    }
    newUserId(databaseId, userId) {
        const dbId = this.parse(databaseId);
        const userResourceId = new ResourceId();
        userResourceId.database = dbId.database;
        userResourceId.user = userId;
        return userResourceId;
    }
    newPermissionId(userId, permissionId) {
        const usrId = this.parse(userId);
        const permissionResourceId = new ResourceId();
        permissionResourceId.database = usrId.database;
        permissionResourceId.user = usrId.user;
        permissionResourceId.permission = permissionId;
        return permissionResourceId;
    }
    newAttachmentId(documentId, attachmentId) {
        const docId = this.parse(documentId);
        const attachmentResourceId = new ResourceId();
        attachmentResourceId.database = docId.database;
        attachmentResourceId.documentCollection = docId.documentCollection;
        attachmentResourceId.document = docId.document;
        attachmentResourceId.attachment = attachmentId;
        return attachmentResourceId;
    }
    tryParse(id) {
        let rid;
        if (!id) {
            return [false, undefined];
        }
        const pair = ResourceId.verify(id);
        if (!pair[0]) {
            return [false, undefined];
        }
        const buffer = pair[1];
        const intArray = new Int8Array(buffer);
        if (buffer.length % 4 !== 0 && buffer.length !== this.offerIdLength) {
            return [false, undefined];
        }
        rid = new ResourceId();
        if (buffer.length === this.offerIdLength) {
            let offer = 0;
            for (let index = 0; index < this.offerIdLength; index++) {
                offer = offer | (intArray[index] << (index * 8));
            }
            rid.offer = offer.toString();
            return [true, rid];
        }
        if (buffer.length >= 4) {
            rid.database = buffer.readIntBE(0, 4).toString();
        }
        if (buffer.length >= 8) {
            const isCollection = (intArray[4] & (128)) > 0;
            if (isCollection) {
                rid.documentCollection = buffer.readIntBE(4, 4).toString();
                const newBuff = new Buffer(4);
                if (buffer.length >= 16) {
                    const subCollectionResource = ResourceId.bigNumberReadIntBE(buffer, 8, 8).toString();
                    if ((intArray[15] >> 4) === this.DocumentByte) {
                        rid.document = subCollectionResource;
                        if (buffer.length === 20) {
                            rid.attachment = buffer.readIntBE(16, 4).toString();
                        }
                    }
                    else if (Math.abs(intArray[15] >> 4) === this.StoredProcedureByte) {
                        rid.storedProcedure = subCollectionResource;
                    }
                    else if ((intArray[15] >> 4) === this.TriggerByte) {
                        rid.trigger = subCollectionResource;
                    }
                    else if ((intArray[15] >> 4) === this.UserDefinedFunctionByte) {
                        rid.userDefinedFunction = subCollectionResource;
                    }
                    else if ((intArray[15] >> 4) === this.ConflictByte) {
                        rid.conflict = subCollectionResource;
                    }
                    else if ((intArray[15] >> 4) === this.PartitionKeyRangeByte) {
                        rid.partitionKeyRange = subCollectionResource;
                    }
                    else {
                        return [false, rid];
                    }
                }
                else if (buffer.length !== 8) {
                    return [false, rid];
                }
            }
            else {
                rid.user = buffer.readIntBE(4, 4).toString();
                if (buffer.length === 16) {
                    rid.permission = ResourceId.bigNumberReadIntBE(buffer, 8, 8).toString();
                }
                else if (buffer.length !== 8) {
                    return [false, rid];
                }
            }
        }
        return [true, rid];
    }
    static verify(id) {
        if (!id) {
            throw (new Error("invalid resource id " + id));
        }
        let buffer = ResourceId.fromBase64String(id);
        if (!buffer || buffer.length > this.length) {
            buffer = undefined;
            return [false, buffer];
        }
        return [true, buffer];
    }
    static verifyBool(id) {
        return ResourceId.verify(id)[0];
    }
    static fromBase64String(s) {
        return new Buffer(s.replace("-", "/"), "base64");
    }
    static toBase64String(buffer) {
        return buffer.toString("base64");
    }
    isDatabaseId() {
        return this.database !== exports.EMPTY && (this.documentCollection === exports.EMPTY && this.user === exports.EMPTY);
    }
    getDatabaseId() {
        const rid = new ResourceId();
        rid.database = this.database;
        return rid;
    }
    getDocumentCollectionId() {
        const rid = new ResourceId();
        rid.database = this.database;
        rid.documentCollection = this.documentCollection;
        return rid;
    }
    getUniqueDocumentCollectionId() {
        const db = BigInt(this.database);
        const coll = BigInt(this.documentCollection);
        return db.shiftLeft(32).or(coll).toString();
    }
    getStoredProcedureId() {
        const rid = new ResourceId();
        rid.database = this.database;
        rid.documentCollection = this.documentCollection;
        rid.storedProcedure = this.storedProcedure;
        return rid;
    }
    getTriggerId() {
        const rid = new ResourceId();
        rid.database = this.database;
        rid.documentCollection = this.documentCollection;
        rid.trigger = this.trigger;
        return rid;
    }
    getUserDefinedFunctionId() {
        const rid = new ResourceId();
        rid.database = this.database;
        rid.documentCollection = this.documentCollection;
        rid.userDefinedFunction = this.userDefinedFunction;
        return rid;
    }
    getConflictId() {
        const rid = new ResourceId();
        rid.database = this.database;
        rid.documentCollection = this.documentCollection;
        rid.conflict = this.conflict;
        return rid;
    }
    getDocumentId() {
        const rid = new ResourceId();
        rid.database = this.database;
        rid.documentCollection = this.documentCollection;
        rid.document = this.document;
        return rid;
    }
    getPartitonKeyRangeId() {
        const rid = new ResourceId();
        rid.database = this.database;
        rid.documentCollection = this.documentCollection;
        rid.partitionKeyRange = this.partitionKeyRange;
        return rid;
    }
    getUserId() {
        const rid = new ResourceId();
        rid.database = this.database;
        rid.user = this.user;
        return rid;
    }
    getPermissionId() {
        const rid = new ResourceId();
        rid.database = this.database;
        rid.user = this.user;
        rid.permission = this.permission;
        return rid;
    }
    getAttachmentId() {
        const rid = new ResourceId();
        rid.database = this.database;
        rid.documentCollection = this.documentCollection;
        rid.document = this.document;
        rid.attachment = this.attachment;
        return rid;
    }
    getOfferId() {
        const rid = new ResourceId();
        rid.offer = this.offer;
        return rid;
    }
    getValue() {
        let len = 0;
        if (this.offer !== exports.EMPTY) {
            len = len + this.offerIdLength;
        }
        else if (this.database !== exports.EMPTY) {
            len = len + 4;
        }
        if (this.documentCollection !== exports.EMPTY || this.user !== exports.EMPTY) {
            len = len + 4;
        }
        if (this.document !== exports.EMPTY || this.permission !== exports.EMPTY
            || this.storedProcedure !== exports.EMPTY || this.trigger !== exports.EMPTY
            || this.userDefinedFunction !== exports.EMPTY || this.conflict !== exports.EMPTY
            || this.partitionKeyRange !== exports.EMPTY) {
            len = len + 8;
        }
        if (this.attachment !== exports.EMPTY) {
            len = len + 4;
        }
        const buffer = new Buffer(len);
        buffer.fill(0);
        if (this.offer !== exports.EMPTY) {
            buffer.writeIntLE(Number(this.offer), 0, this.offerIdLength);
        }
        else if (this.database !== exports.EMPTY) {
            buffer.writeIntBE(Number(this.database), 0, 4);
        }
        if (this.documentCollection !== exports.EMPTY) {
            buffer.writeIntBE(Number(this.documentCollection), 4, 4);
        }
        else if (this.user !== exports.EMPTY) {
            buffer.writeIntBE(Number(this.user), 4, 4);
        }
        let big;
        if (this.storedProcedure !== exports.EMPTY) {
            big = new int64_buffer_1.Int64BE(this.storedProcedure);
            big.toBuffer().copy(buffer, 8, 0, 8);
        }
        else if (this.trigger !== exports.EMPTY) {
            big = new int64_buffer_1.Int64BE(this.trigger);
            big.toBuffer().copy(buffer, 8, 0, 8);
        }
        else if (this.userDefinedFunction !== exports.EMPTY) {
            big = new int64_buffer_1.Int64BE(this.userDefinedFunction);
            big.toBuffer().copy(buffer, 8, 0, 8);
        }
        else if (this.conflict !== exports.EMPTY) {
            big = new int64_buffer_1.Int64BE(this.conflict);
            big.toBuffer().copy(buffer, 8, 0, 8);
        }
        else if (this.document !== exports.EMPTY) {
            big = new int64_buffer_1.Int64BE(this.document);
            big.toBuffer().copy(buffer, 8, 0, 8);
        }
        else if (this.permission !== exports.EMPTY) {
            big = new int64_buffer_1.Int64BE(this.permission);
            big.toBuffer().copy(buffer, 8, 0, 8);
        }
        else if (this.partitionKeyRange !== exports.EMPTY) {
            big = new int64_buffer_1.Int64BE(this.partitionKeyRange);
            big.toBuffer().copy(buffer, 8, 0, 8);
        }
        if (this.attachment !== exports.EMPTY) {
            buffer.writeIntBE(Number(this.attachment), 16, 4);
        }
        return buffer;
    }
    toString() {
        return ResourceId.toBase64String(this.getValue());
    }
    static bigNumberReadIntBE(buffer, offset, byteLength) {
        offset = offset >>> 0;
        byteLength = byteLength >>> 0;
        let i = byteLength;
        let mul = BigInt("1");
        let val = BigInt(buffer[offset + --i]);
        while (i > 0 && mul) {
            const temp = BigInt(buffer[offset + --i]);
            val = val.plus(temp.times(mul));
            mul = mul.times(0x100);
        }
        mul = mul.times(0x80);
        if (val.greater(mul)) {
            const subtrahend = BigInt(2);
            val = val.minus(subtrahend.pow(8 * byteLength));
        }
        return val;
    }
}
exports.ResourceId = ResourceId;
//# sourceMappingURL=resourceId.js.map