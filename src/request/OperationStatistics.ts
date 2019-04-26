import { OperationType, ResourceType } from "../common";

export interface OperationStats {
  activityId: string;
  start: Date;
  end: Date;
  duration: number;
  success: boolean;
  retryInfo: RetryInfo;
  toString(): string;
  toJSON(): string;
}

export interface RetryInfo {
  throttledCount: number;
  networkingErrorCount: number;
  unavailabilityCount: number;
}

export class InternalOperationStats implements OperationStats {
  public start: Date;
  public end: Date;

  public success: boolean;

  private $retryInfo: RetryInfo = {
    throttledCount: 0,
    networkingErrorCount: 0,
    unavailabilityCount: 0
  };

  public get retryInfo(): RetryInfo {
    const retryInfo: RetryInfo = { ...this.$retryInfo };
    for (const child of this.childOperationStats) {
      if (!child) {
        continue;
      }
      const childRetryInfo = child.retryInfo;
      retryInfo.networkingErrorCount += childRetryInfo.networkingErrorCount;
      retryInfo.throttledCount += childRetryInfo.throttledCount;
      retryInfo.unavailabilityCount += childRetryInfo.unavailabilityCount;
    }
    return retryInfo;
  }

  public get duration(): number {
    return this.end ? this.end.getTime() - this.start.getTime() : undefined;
  }

  public readonly details: Map<string, string> = new Map<string, string>();
  private childOperationStats: InternalOperationStats[] = [];

  constructor(
    public readonly resource: ResourceType,
    public readonly operation: OperationType,
    public readonly path: string,
    public readonly activityId: string
  ) {
    this.start = new Date();
  }

  public createChildOperation(resource?: ResourceType, operation?: OperationType, path?: string, activityId?: string) {
    const child = new InternalOperationStats(
      resource || this.resource,
      operation || this.operation,
      path || this.path,
      activityId || this.activityId
    );
    this.childOperationStats.push(child);
    return child;
  }

  public mergeChildOperation(child: InternalOperationStats) {
    if (child) {
      this.childOperationStats.push(child);
    }
    return child;
  }

  public complete() {
    this.end = new Date();
    this.success = true;
  }

  public fail(e?: Error) {
    this.end = new Date();
    this.success = false;
    if (e !== undefined) {
      this.details.set("Error", e.toString());
    }
  }

  public throttled(e?: Error) {
    this.$retryInfo.throttledCount++;
    this.fail(e);
  }

  public unavailable(e?: Error) {
    this.$retryInfo.unavailabilityCount++;
    this.fail(e);
  }

  public networkingFailure(e?: Error) {
    this.$retryInfo.networkingErrorCount++;
    this.fail(e);
  }

  public toString(): string {
    return this.toJSON();
  }

  public toJSON() {
    return JSON.stringify({
      activityId: this.activityId,
      operationType: this.operation,
      resourceType: this.resource,
      path: this.path,
      success: this.success,
      startTime: this.start,
      endTime: this.end,
      retryInfo: this.retryInfo,
      children: this.childOperationStats
    });
  }
}
