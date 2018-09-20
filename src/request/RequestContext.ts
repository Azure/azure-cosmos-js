import { ClientContext } from "../ClientContext";

export interface RequestContext {
  path?: string;
  operationType?: string;
  client?: ClientContext;
  retryCount?: number;
  resourceType?: string;
  ignorePreferredLocation?: boolean;
  locationIndexToRoute?: number;
  locationEndpointToRoute?: string;
}
