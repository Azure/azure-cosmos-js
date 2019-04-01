import { CosmosHeaders } from "../index";

export interface Response<T> {
  headers: NonNullable<CosmosHeaders>;
  result?: T;
  statusCode?: number;
}
