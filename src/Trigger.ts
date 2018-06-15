import { RequestOptions } from "http";
import { Response } from ".";
import { Container } from "./Container";
import { TriggerDefinition } from "./TriggerDefinition";

export class Trigger {
    constructor(public readonly container: Container, public readonly id: string) { }

    public read(options?: RequestOptions): Promise<Response<TriggerDefinition>> {
        throw new Error("Not yet implemented");
    }

    public replace(options?: RequestOptions): Promise<Response<TriggerDefinition>> {
        throw new Error("Not yet implemented");
    }

    public delete(options?: RequestOptions): Promise<Response<TriggerDefinition>> {
        throw new Error("Not yet implemented");
    }
}
