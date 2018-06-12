import QueryMetricsConstants from "./queryMetricsConstants";
import { QueryMetricsUtils } from "./queryMetricsUtils";
import { TimeSpan } from "./timeSpan";

export class QueryPreparationTimes {
    private queryCompilationTime: any;
    private logicalPlanBuildTime: any;
    private physicalPlanBuildTime: any;
    private queryOptimizationTime: any;
    constructor(
        queryCompilationTime: TimeSpan, logicalPlanBuildTime: TimeSpan,
        physicalPlanBuildTime: TimeSpan, queryOptimizationTime: TimeSpan) {
        if (queryCompilationTime == null) {
            throw new Error("queryCompilationTime is null or undefined");
        }

        if (logicalPlanBuildTime == null) {
            throw new Error("logicalPlanBuildTime is null or undefined");
        }

        if (physicalPlanBuildTime == null) {
            throw new Error("physicalPlanBuildTime is null or undefined");
        }

        if (queryOptimizationTime == null) {
            throw new Error("queryOptimizationTime is null or undefined");
        }

        // Constructor
        this.queryCompilationTime = queryCompilationTime;
        this.logicalPlanBuildTime = logicalPlanBuildTime;
        this.physicalPlanBuildTime = physicalPlanBuildTime;
        this.queryOptimizationTime = queryOptimizationTime;
    }

    /**
     * Gets the QueryCompilationTime
     * @memberof QueryPreparationTimes
     * @instance
     * @ignore
     */
    public getQueryCompilationTime() {
        return this.queryCompilationTime;
    }

    /**
     * Gets the LogicalPlanBuildTime
     * @memberof QueryPreparationTimes
     * @instance
     * @ignore
     */
    public getLogicalPlanBuildTime() {
        return this.logicalPlanBuildTime;
    }

    /**
     * Gets the PhysicalPlanBuildTime
     * @memberof QueryPreparationTimes
     * @instance
     * @ignore
     */
    public getPhysicalPlanBuildTime() {
        return this.physicalPlanBuildTime;
    }

    /**
     * Gets the QueryOptimizationTime
     * @memberof QueryPreparationTimes
     * @instance
     * @ignore
     */
    public getQueryOptimizationTime() {
        return this.queryOptimizationTime;
    }

    /**
     * returns a new QueryPreparationTimes instance that is the addition of this and the arguments.
     * @memberof QueryPreparationTimes
     * @instance
     * @ignore
     */
    public add(queryPreparationTimesArray: QueryPreparationTimes[]) {
        if (arguments == null || arguments.length === 0) {
            throw new Error("arguments was null or empty");
        }

        queryPreparationTimesArray.push(this);

        let queryCompilationTime = TimeSpan.zero;
        let logicalPlanBuildTime = TimeSpan.zero;
        let physicalPlanBuildTime = TimeSpan.zero;
        let queryOptimizationTime = TimeSpan.zero;

        for (const queryPreparationTimes of queryPreparationTimesArray) {
            if (queryPreparationTimes == null) {
                throw new Error("queryPreparationTimesArray has null or undefined item(s)");
            }

            queryCompilationTime = queryCompilationTime.add(queryPreparationTimes.queryCompilationTime);
            logicalPlanBuildTime = logicalPlanBuildTime.add(queryPreparationTimes.logicalPlanBuildTime);
            physicalPlanBuildTime = physicalPlanBuildTime.add(queryPreparationTimes.physicalPlanBuildTime);
            queryOptimizationTime = queryOptimizationTime.add(queryPreparationTimes.queryOptimizationTime);
        }

        return new QueryPreparationTimes(
            queryCompilationTime,
            logicalPlanBuildTime,
            physicalPlanBuildTime,
            queryOptimizationTime);
    }

    /**
     * Output the QueryPreparationTimes as a delimited string.
     * @memberof QueryPreparationTimes
     * @instance
     * @ignore
     */
    public toDelimitedString() {
        return `${QueryMetricsConstants.QueryCompileTimeInMs}=${this.queryCompilationTime.totalMilliseconds()};`
            + `${QueryMetricsConstants.LogicalPlanBuildTimeInMs}=${this.logicalPlanBuildTime.totalMilliseconds()};`
            + `${QueryMetricsConstants.PhysicalPlanBuildTimeInMs}=${this.physicalPlanBuildTime.totalMilliseconds()};`
            + `${QueryMetricsConstants.QueryOptimizationTimeInMs}=${this.queryOptimizationTime.totalMilliseconds()}`;
    }

    public static readonly zero = new QueryPreparationTimes(TimeSpan.zero, TimeSpan.zero, TimeSpan.zero, TimeSpan.zero);

    /**
     * Returns a new instance of the QueryPreparationTimes class that is the
     * aggregation of an array of QueryPreparationTimes.
     * @memberof QueryMetrics
     * @instance
     */
    public static createFromArray(queryPreparationTimesArray: QueryPreparationTimes[]) {
        if (queryPreparationTimesArray == null) {
            throw new Error("queryPreparationTimesArray is null or undefined item(s)");
        }

        return QueryPreparationTimes.zero.add(queryPreparationTimesArray);
    }

    /**
     * Returns a new instance of the QueryPreparationTimes class this is deserialized from a delimited string.
     * @memberof QueryMetrics
     * @instance
     */
    public static createFromDelimitedString(delimitedString: string) {
        const metrics = QueryMetricsUtils.parseDelimitedString(delimitedString);

        return new QueryPreparationTimes(
            QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.QueryCompileTimeInMs),
            QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.LogicalPlanBuildTimeInMs),
            QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.PhysicalPlanBuildTimeInMs),
            QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.QueryOptimizationTimeInMs));
    }
}
