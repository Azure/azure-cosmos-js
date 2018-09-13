import { ClientContext } from "../ClientContext";

export interface RequestContext {
  path?: string;
  operationType?: string;
  client?: ClientContext;
  endpointOverride?: boolean; // ?
  retryCount?: number;
  resourceType?: string;
}
