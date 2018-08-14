import { ClientContext } from "../ClientContext";

export interface RequestContext {
  path?: string;
  operationType?: string;
  client?: ClientContext;
  endpointOverride?: boolean; // ?
  useAlternateWriteEndpoint?: boolean;
  resourceType?: string;
}
