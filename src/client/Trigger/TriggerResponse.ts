import { CosmosResponse } from "../../request";
import { TriggerDefinition } from "./TriggerDefinition";
import { Trigger } from ".";

export interface TriggerResponse extends CosmosResponse<TriggerDefinition, Trigger> {
  trigger: Trigger;
}
