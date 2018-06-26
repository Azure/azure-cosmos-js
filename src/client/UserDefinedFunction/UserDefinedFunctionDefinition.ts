export interface UserDefinedFunctionDefinition {
    id?: string;
    body?: string | (() => void);
}
