declare module "create-hmac" {
  type Utf8AsciiLatin1Encoding = "utf8" | "ascii" | "latin1";
  type HexBase64Latin1Encoding = "latin1" | "hex" | "base64";

  interface Hmac extends NodeJS.ReadWriteStream {
    update(data: string | Buffer | DataView): Hmac;
    update(data: string | Buffer | DataView, input_encoding: Utf8AsciiLatin1Encoding): Hmac;
    digest(): Buffer;
    digest(encoding: HexBase64Latin1Encoding): string;
  }

  function createHmac(algorithm: string, key: string | Buffer): Hmac;

  export = createHmac;
}
