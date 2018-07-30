import { CosmosResponse } from "../../request/CosmosResponse";
import { Item } from "./Item";
import { ItemBody } from "./ItemBody";

export interface ItemResponse<T> extends CosmosResponse<T & ItemBody, Item> {
  /** Reference to the {@link Item} the response corresponds to. */
  item: Item;
}
