import { Response } from ".";
import { Container } from "./Container";
import { RequestOptions } from "./documentclient";

export class Item {
    constructor(
        public readonly container: Container,
        public readonly id: string,
        public readonly primaryKey: string) { }

    public read<T>(options?: RequestOptions): Promise<Response<T>> {
        throw new Error("Not yet implemented");
    }

    public replace<T>(options?: RequestOptions): Promise<Response<T>> {
        throw new Error("Not yet implemented");
    }

    public delete<T>(options?: RequestOptions): Promise<Response<T>> {
        throw new Error("Not yet implemented");
    }
}
