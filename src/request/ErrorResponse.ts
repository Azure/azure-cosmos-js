import { CosmosHeaders } from "../index";

interface ErrorBody {
  code: string;
  message: string;
  additionalErrorInfo?: AdditionalErrorInfo;
}

interface AdditionalErrorInfo {
  partitionedQueryExecutionInfoVersion: number;
  queryInfo: any; // TODO add types
  queryRanges: any[]; // TODO add types
}

export interface ErrorResponse {
  code?: number;
  substatus?: number;
  body?: ErrorBody;
  headers?: CosmosHeaders;
  activityId?: string;
  retryAfterInMilliseconds?: number;
  [key: string]: any;
}
