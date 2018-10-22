// tslint:disable:no-bitwise

/** @hidden */
export const EMPTY = "0"; // TODO: This is kinda hacky

/** @hidden */
export class ResourceId {
  public database: string;
  public documentCollection: string;
  public length: number;
  public offerIdLength: number;

  constructor() {
    this.database = EMPTY;
    this.documentCollection = EMPTY;
    this.length = 20;
    this.offerIdLength = 3;
  }

  public parse(id: string) {
    const pair = this.tryParse(id);

    if (!pair[0]) {
      throw new Error("invalid resource id " + id);
    }
    return pair[1];
  }

  public tryParse(id: string): [boolean, ResourceId] {
    let rid;
    if (!id) {
      return [false, undefined];
    }

    const pair = this.verify(id);

    if (!pair[0]) {
      return [false, undefined];
    }

    const buffer = pair[1];

    const intArray = new Int8Array(buffer);

    if (buffer.length % 4 !== 0 && buffer.length !== this.offerIdLength) {
      return [false, undefined];
    }

    rid = new ResourceId();

    // first 4 bytes represent the database
    if (buffer.length >= 4) {
      rid.database = buffer.readIntBE(0, 4).toString();
    }

    if (buffer.length >= 8) {
      const isCollection = (intArray[4] & 128) > 0;
      if (isCollection) {
        // 5th - 8th bytes represents the collection
        rid.documentCollection = buffer.readIntBE(4, 4).toString();
      }
    }

    return [true, rid];
  }

  public verify(id: string): [boolean, Buffer] {
    if (!id) {
      throw new Error("invalid resource id " + id);
    }

    let buffer = ResourceId.fromBase64String(id);
    if (!buffer || buffer.length > this.length) {
      buffer = undefined;
      return [false, buffer];
    }

    return [true, buffer];
  }

  public static fromBase64String(s: string) {
    return Buffer.from(s.replace("-", "/"), "base64");
  }

  public getUniqueDocumentCollectionId() {
    return this.documentCollection;
    // TODO someone good at binary math should look at this
    // const db = BigInt(this.database);
    // const coll = BigInt(this.documentCollection);
    // return db
    //   .shiftLeft(32)
    //   .or(coll)
    //   .toString();
  }
}
