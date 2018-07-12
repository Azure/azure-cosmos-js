﻿import * as assert from "assert";
import * as util from "util";
import { DocumentProducer } from "./documentProducer";

// TODO: this smells funny
const TYPEORDCOMPARATOR: {
  [type: string]: { ord: number; compFunc?: (a: any, b: any) => number };
} = Object.freeze({
  NoValue: {
    ord: 0
  },
  undefined: {
    ord: 1
  },
  boolean: {
    ord: 2,
    compFunc: (a: boolean, b: boolean) => {
      return a === b ? 0 : a > b ? 1 : -1;
    }
  },
  number: {
    ord: 4,
    compFunc: (a: number, b: number) => {
      return a === b ? 0 : a > b ? 1 : -1;
    }
  },
  string: {
    ord: 5,
    compFunc: (a: string, b: string) => {
      return a === b ? 0 : a > b ? 1 : -1;
    }
  }
});

export class OrderByDocumentProducerComparator {
  constructor(public sortOrder: string[]) {} // TODO: This should be an enum

  public targetPartitionKeyRangeDocProdComparator(docProd1: DocumentProducer, docProd2: DocumentProducer) {
    const a = docProd1.getTargetParitionKeyRange()["minInclusive"];
    const b = docProd2.getTargetParitionKeyRange()["minInclusive"];
    return a === b ? 0 : a > b ? 1 : -1;
  }

  public compare(docProd1: DocumentProducer, docProd2: DocumentProducer) {
    // Need to check for split, since we don't want to dereference "item" of undefined / exception
    if (docProd1.gotSplit()) {
      return -1;
    }
    if (docProd2.gotSplit()) {
      return 1;
    }

    const orderByItemsRes1 = this.getOrderByItems(docProd1.peekBufferedItems()[0]);
    const orderByItemsRes2 = this.getOrderByItems(docProd2.peekBufferedItems()[0]);

    // validate order by items and types
    // TODO: once V1 order by on different types is fixed this need to change
    this.validateOrderByItems(orderByItemsRes1, orderByItemsRes2);

    // no async call in the for loop
    for (let i = 0; i < orderByItemsRes1.length; i++) {
      // compares the orderby items one by one
      const compRes = this.compareOrderByItem(orderByItemsRes1[i], orderByItemsRes2[i]);
      if (compRes !== 0) {
        if (this.sortOrder[i] === "Ascending") {
          return compRes;
        } else if (this.sortOrder[i] === "Descending") {
          return -compRes;
        }
      }
    }

    return this.targetPartitionKeyRangeDocProdComparator(docProd1, docProd2);
  }

  // TODO: This smells funny
  public compareValue(item1: any, type1: string, item2: any, type2: string) {
    const type1Ord = TYPEORDCOMPARATOR[type1].ord;
    const type2Ord = TYPEORDCOMPARATOR[type2].ord;
    const typeCmp = type1Ord - type2Ord;

    if (typeCmp !== 0) {
      // if the types are different, use type ordinal
      return typeCmp;
    }

    // both are of the same type
    if (type1Ord === TYPEORDCOMPARATOR["undefined"].ord || type1Ord === TYPEORDCOMPARATOR["NoValue"].ord) {
      // if both types are undefined or Null they are equal
      return 0;
    }

    const compFunc = TYPEORDCOMPARATOR[type1].compFunc;
    assert.notEqual(compFunc, undefined, "cannot find the comparison function");
    // same type and type is defined compare the items
    return compFunc(item1, item2);
  }

  public compareOrderByItem(orderByItem1: any, orderByItem2: any) {
    const type1 = this.getType(orderByItem1);
    const type2 = this.getType(orderByItem2);
    return this.compareValue(orderByItem1["item"], type1, orderByItem2["item"], type2);
  }

  public validateOrderByItems(res1: string[], res2: string[]) {
    this._throwIf(res1.length !== res2.length, util.format("Expected %s, but got %s.", res1.length, res2.length));
    this._throwIf(res1.length !== this.sortOrder.length, "orderByItems cannot have a different size than sort orders.");

    for (let i = 0; i < this.sortOrder.length; i++) {
      const type1 = this.getType(res1[i]);
      const type2 = this.getType(res2[i]);
      this._throwIf(type1 !== type2, util.format("Expected %s, but got %s.", type1, type2));
    }
  }

  public getType(orderByItem: any) {
    // TODO: any item?
    if (orderByItem === undefined || orderByItem.item === undefined) {
      return "NoValue";
    }
    const type = typeof orderByItem.item;
    this._throwIf(TYPEORDCOMPARATOR[type] === undefined, util.format("unrecognizable type %s", type));
    return type;
  }

  public getOrderByItems(res: any) {
    // TODO: any res?
    return res["orderByItems"];
  }

  // TODO: this should be done differently...
  public _throwIf(condition: boolean, msg: string) {
    if (condition) {
      throw Error(msg);
    }
  }
}
