/**
 * The default path for the partition key if the user does not specify one on container create.
 * @hidden
 * @internal
 */
export const DEFAULT_PARTITION_KEY_PATH = "/_partitionKey";
/**
 * Header value used for indicating undefined partition key value
 * @hidden
 * @internal
 */
export const EMPTY_PARTITION_KEY = [{}] as const;
