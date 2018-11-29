export interface ChangeFeedOptions {
  maxItemCount?: number;
  continuation?: string;
  sessionToken?: string;
  partitionKeyRangeId?: string;
  partitionKey?: string | number | boolean;
  startFromBeginning?: boolean;
  startTime?: Date;
}
