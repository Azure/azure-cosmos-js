import { ContainerDefinition } from "./ContainerDefinition";
import { Database } from "./Database";
import { RequestOptions } from "./documentclient";
import { Items } from "./Items";
import { Response } from "./request";
import { StoredProcedures } from "./StoredProcedures";
import { Triggers } from "./Triggers";
import { UserDefinedFunctions } from "./UserDefinedFunctions";

export class Container {
    public readonly items: Items;
    public readonly storedProcedures: StoredProcedures;
    public readonly triggers: Triggers;
    public readonly userDefinedFunctions: UserDefinedFunctions;

    constructor(public readonly database: Database, public readonly id: string) {
        this.items = new Items(this);
        this.storedProcedures = new StoredProcedures(this);
        this.triggers = new Triggers(this);
        this.userDefinedFunctions = new UserDefinedFunctions(this);
    }

    public read(options?: RequestOptions): Promise<Response<ContainerDefinition>> {
        throw new Error("Not yet implemented");
    }

    public replace(options?: RequestOptions): Promise<Response<ContainerDefinition>> {
        throw new Error("Not yet implemented");
    }

    public delete(options?: RequestOptions): Promise<Response<ContainerDefinition>> {
        throw new Error("Not yet implemented");
    }
}
