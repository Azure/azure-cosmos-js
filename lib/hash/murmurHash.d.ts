/// <reference types="node" />
export declare type Key = string | Buffer | number;
export declare class MurmurHash {
    static hash(key: Key, seed: number): number;
    private static _throwIfInvalidKey(key);
    private static _throwIfInvalidSeed(seed);
    private static _getBufferFromString(s);
    private static _getBufferFromNumber(i);
    private static _hashBytes(bytes, seed);
    private static _rotateLeft(n, numBits);
    private static _multiply(m, n);
    private static _readUInt32(uintArray, i);
}
