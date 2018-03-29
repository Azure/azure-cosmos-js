import { IHeaders } from ".";

export interface IExecutionContext {
    nextItem: () => Promise<[any, IHeaders]>;
    current: () => Promise<[any, IHeaders]>;
    hasMoreResults: () => boolean;
    fetchMore?: () => Promise<[any, IHeaders]>; // TODO: code smell
}
