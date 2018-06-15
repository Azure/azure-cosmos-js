import { Container } from "./Container";
import { FeedOptions, RequestOptions } from "./documentclient";
import { SqlQuerySpec } from "./queryExecutionContext";
import { QueryIterator } from "./queryIterator";
import { Trigger } from "./Trigger";
import { TriggerDefinition } from "./TriggerDefinition";
import { Response } from "./request";

export class Triggers {
    constructor(public readonly container: Container) {}

    public getTrigger(id: string): Trigger {
        return new Trigger(this.container, id);
    }

    public query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<TriggerDefinition> {
        throw new Error("Not yet implemented");
    }

    public read(options?: FeedOptions): QueryIterator<TriggerDefinition> {
        throw new Error("Not yet implemented");
    }

    public create(body: TriggerDefinition, options?: RequestOptions): Promise<Response<TriggerDefinition>> {
        throw new Error("Not yet implemented");
    }

    public upsert(body: TriggerDefinition, options?: RequestOptions): Promise<Response<TriggerDefinition>> {
        throw new Error("Not yet implemented");
    }
}
