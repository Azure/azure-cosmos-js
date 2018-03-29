import { IHeaders } from "..";

export interface IEndpointComponent {
    nextItem: () => Promise<[any, IHeaders]>;
    current: () => Promise<[any, IHeaders]>;
    hasMoreResults: () => boolean;
}
