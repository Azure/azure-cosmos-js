export interface UserDefinedFunctionDefinition {
    id?: string;
    /** The body of the user defined function, it can also be passed as a stringifed function */
    body?: string | (() => void);
}
