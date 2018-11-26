export interface ChangeFeedOptions {
  maxItemCount?: number;
  requestContinuation?: string;
  sessionToken?: string;
  partitionKeyRangeId?: string;
  partitionKey?: string | number | boolean;
  startFromBeginning?: boolean;
  startTime?: Date;
}
