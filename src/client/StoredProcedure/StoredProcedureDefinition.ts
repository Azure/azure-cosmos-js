export interface StoredProcedureDefinition {
    id?: string;
    body?(...inputs: any[]): void;
}
