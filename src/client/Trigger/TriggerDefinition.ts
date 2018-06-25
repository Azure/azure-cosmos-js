import { TriggerOperation, TriggerType } from "../../documents";

export interface TriggerDefinition {
    id?: string;
    body: (() => void) | string;
    triggerType: TriggerType;
    triggerOperation: TriggerOperation;
}
