import { CosmosHeaders } from "../index";
import { OperationStats } from "./OperationStatistics";

export interface Response<T> {
  headers: CosmosHeaders;
  result: T;
  statusCode?: number; // TODO: make this non-optional
  operationStatistics?: OperationStats; // TODO: make this non-optional
}
