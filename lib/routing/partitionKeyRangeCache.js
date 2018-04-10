"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const semaphore = require("semaphore");
const base_1 = require("../base");
const _1 = require("./");
class PartitionKeyRangeCache {
    constructor(documentclient) {
        this.documentclient = documentclient;
        this.collectionRoutingMapByCollectionId = {};
        this.sem = semaphore(1);
    }
    onCollectionRoutingMap(collectionLink) {
        return __awaiter(this, void 0, void 0, function* () {
            const isNameBased = base_1.Base.isLinkNameBased(collectionLink);
            const collectionId = this.documentclient.getIdFromLink(collectionLink, isNameBased);
            let collectionRoutingMap = this.collectionRoutingMapByCollectionId[collectionId];
            if (collectionRoutingMap === undefined) {
                collectionRoutingMap = yield new Promise((resolve, reject) => {
                    const semaphorizedFuncCollectionMapInstantiator = () => {
                        let crm = this.collectionRoutingMapByCollectionId[collectionId];
                        if (crm === undefined) {
                            const partitionKeyRangesIterator = this.documentclient.readPartitionKeyRanges(collectionLink);
                            partitionKeyRangesIterator.toArray((err, resources) => {
                                if (err) {
                                    return reject(err);
                                }
                                crm = _1.CollectionRoutingMapFactory.createCompleteRoutingMap(resources.map((r) => [r, true]), collectionId);
                                this.collectionRoutingMapByCollectionId[collectionId] = crm;
                                this.sem.leave();
                                resolve(crm);
                            });
                        }
                        else {
                            this.sem.leave();
                            reject(new Error("Not yet implemented"));
                        }
                    };
                    this.sem.take(semaphorizedFuncCollectionMapInstantiator);
                });
            }
            return collectionRoutingMap;
        });
    }
    getOverlappingRanges(collectionLink, queryRanges) {
        return __awaiter(this, void 0, void 0, function* () {
            const crm = yield this.onCollectionRoutingMap(collectionLink);
            return crm.getOverlappingRanges(queryRanges);
        });
    }
}
exports.PartitionKeyRangeCache = PartitionKeyRangeCache;
//# sourceMappingURL=partitionKeyRangeCache.js.map