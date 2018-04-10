"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MurmurHash {
    static hash(key, seed) {
        key = key || "";
        seed = seed || 0;
        MurmurHash._throwIfInvalidKey(key);
        MurmurHash._throwIfInvalidSeed(seed);
        let buffer;
        if (typeof key === "string") {
            buffer = MurmurHash._getBufferFromString(key);
        }
        else if (typeof key === "number") {
            buffer = MurmurHash._getBufferFromNumber(key);
        }
        else {
            buffer = key;
        }
        return MurmurHash._hashBytes(buffer, seed);
    }
    static _throwIfInvalidKey(key) {
        if (key instanceof Buffer) {
            return;
        }
        if (typeof key === "string") {
            return;
        }
        if (typeof key === "number") {
            return;
        }
        throw new Error("Invalid argument: 'key' has to be a Buffer, string, or number.");
    }
    static _throwIfInvalidSeed(seed) {
        if (isNaN(seed)) {
            throw new Error("Invalid argument: 'seed' is not and cannot be converted to a number.");
        }
    }
    static _getBufferFromString(s) {
        const buffer = new Buffer(s);
        return buffer;
    }
    static _getBufferFromNumber(i) {
        i = i >>> 0;
        const buffer = new Uint8Array([
            i >>> 0,
            i >>> 8,
            i >>> 16,
            i >>> 24,
        ]);
        return buffer;
    }
    static _hashBytes(bytes, seed) {
        const c1 = 0xcc9e2d51;
        const c2 = 0x1b873593;
        let i = 0;
        let h1 = seed;
        const reader = new Uint32Array(bytes);
        for (i = 0; i < bytes.length - 3; i += 4) {
            let k1 = MurmurHash._readUInt32(reader, i);
            k1 = MurmurHash._multiply(k1, c1);
            k1 = MurmurHash._rotateLeft(k1, 15);
            k1 = MurmurHash._multiply(k1, c2);
            h1 ^= k1;
            h1 = MurmurHash._rotateLeft(h1, 13);
            h1 = MurmurHash._multiply(h1, 5) + 0xe6546b64;
        }
        let k = 0;
        switch (bytes.length & 3) {
            case 3:
                k ^= reader[i + 2] << 16;
                k ^= reader[i + 1] << 8;
                k ^= reader[i];
                break;
            case 2:
                k ^= reader[i + 1] << 8;
                k ^= reader[i];
                break;
            case 1:
                k ^= reader[i];
                break;
        }
        k = MurmurHash._multiply(k, c1);
        k = MurmurHash._rotateLeft(k, 15);
        k = MurmurHash._multiply(k, c2);
        h1 ^= k;
        h1 ^= bytes.length;
        h1 ^= h1 >>> 16;
        h1 = MurmurHash._multiply(h1, 0x85ebca6b);
        h1 ^= h1 >>> 13;
        h1 = MurmurHash._multiply(h1, 0xc2b2ae35);
        h1 ^= h1 >>> 16;
        return h1 >>> 0;
    }
    static _rotateLeft(n, numBits) {
        return (n << numBits) | (n >>> (32 - numBits));
    }
    static _multiply(m, n) {
        return ((m & 0xffff) * n) + ((((m >>> 16) * n) & 0xffff) << 16);
    }
    static _readUInt32(uintArray, i) {
        return (uintArray[i]) | (uintArray[i + 1] << 8) | (uintArray[i + 2] << 16) | (uintArray[i + 3] << 24) >>> 0;
    }
}
exports.MurmurHash = MurmurHash;
//# sourceMappingURL=murmurHash.js.map