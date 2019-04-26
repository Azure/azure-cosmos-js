import { CosmosHeaders } from "../index";
import { InternalOperationStats } from "./OperationStatistics";

export interface Response<T> {
  headers: CosmosHeaders;
  result: T;
  statusCode?: number; // TODO: make this non-optional
  operationStatistics?: InternalOperationStats; // TODO: make this non-optional
}
