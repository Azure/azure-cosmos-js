import QueryMetricsConstants from "./queryMetricsConstants";
import { QueryMetricsUtils } from "./queryMetricsUtils";
import { TimeSpan } from "./timeSpan";

export class RuntimeExecutionTimes {
    private queryEngineExecutionTime: TimeSpan;
    private systemFunctionExecutionTime: TimeSpan;
    private userDefinedFunctionExecutionTime: TimeSpan;
    constructor(
        queryEngineExecutionTime: TimeSpan, systemFunctionExecutionTime: TimeSpan,
        userDefinedFunctionExecutionTime: TimeSpan) {
        // Constructor

        if (queryEngineExecutionTime == null) {
            throw new Error("queryEngineExecutionTime is null or undefined");
        }

        if (systemFunctionExecutionTime == null) {
            throw new Error("systemFunctionExecutionTime is null or undefined");
        }

        if (userDefinedFunctionExecutionTime == null) {
            throw new Error("userDefinedFunctionExecutionTime is null or undefined");
        }

        this.queryEngineExecutionTime = queryEngineExecutionTime;
        this.systemFunctionExecutionTime = systemFunctionExecutionTime;
        this.userDefinedFunctionExecutionTime = userDefinedFunctionExecutionTime;
    }

    /**
     * Gets the QueryEngineExecutionTime
     * @memberof RuntimeExecutionTimes
     * @instance
     * @ignore
     */
    public getQueryEngineExecutionTime() {
        return this.queryEngineExecutionTime;
    }

    /**
     * Gets the SystemFunctionExecutionTime
     * @memberof RuntimeExecutionTimes
     * @instance
     * @ignore
     */
    public getSystemFunctionExecutionTime() {
        return this.systemFunctionExecutionTime;
    }

    /**
     * Gets the UserDefinedFunctionExecutionTime
     * @memberof RuntimeExecutionTimes
     * @instance
     * @ignore
     */
    public getUserDefinedFunctionExecutionTime() {
        return this.userDefinedFunctionExecutionTime;
    }

    /**
     * returns a new RuntimeExecutionTimes instance that is the addition of this and the arguments.
     * @memberof RuntimeExecutionTimes
     * @instance
     * @ignore
     */
    public add(runtimeExecutionTimesArray: RuntimeExecutionTimes[]) {
        if (arguments == null || arguments.length === 0) {
            throw new Error("arguments was null or empty");
        }

        runtimeExecutionTimesArray.push(this);

        let queryEngineExecutionTime = TimeSpan.zero;
        let systemFunctionExecutionTime = TimeSpan.zero;
        let userDefinedFunctionExecutionTime = TimeSpan.zero;

        for (const runtimeExecutionTimes of runtimeExecutionTimesArray) {

            if (runtimeExecutionTimes == null) {
                throw new Error("runtimeExecutionTimes has null or undefined item(s)");
            }

            queryEngineExecutionTime = queryEngineExecutionTime.add(runtimeExecutionTimes.queryEngineExecutionTime);
            systemFunctionExecutionTime =
                systemFunctionExecutionTime.add(runtimeExecutionTimes.systemFunctionExecutionTime);
            userDefinedFunctionExecutionTime =
                userDefinedFunctionExecutionTime.add(runtimeExecutionTimes.userDefinedFunctionExecutionTime);
        }

        return new RuntimeExecutionTimes(
            queryEngineExecutionTime,
            systemFunctionExecutionTime,
            userDefinedFunctionExecutionTime);
    }

    /**
     * Output the RuntimeExecutionTimes as a delimited string.
     * @memberof RuntimeExecutionTimes
     * @instance
     * @ignore
     */
    public toDelimitedString() {
        // tslint:disable-next-line:max-line-length
        return `${QueryMetricsConstants.SystemFunctionExecuteTimeInMs}=${this.systemFunctionExecutionTime.totalMilliseconds()};`
            // tslint:disable-next-line:max-line-length
            + `${QueryMetricsConstants.UserDefinedFunctionExecutionTimeInMs}=${this.userDefinedFunctionExecutionTime.totalMilliseconds()}`;
    }

    public static readonly zero = new RuntimeExecutionTimes(TimeSpan.zero, TimeSpan.zero, TimeSpan.zero);

    /**
     * Returns a new instance of the RuntimeExecutionTimes class that is
     *  the aggregation of an array of RuntimeExecutionTimes.
     * @memberof RuntimeExecutionTimes
     * @instance
     */
    public static createFromArray(runtimeExecutionTimesArray: RuntimeExecutionTimes[]) {
        if (runtimeExecutionTimesArray == null) {
            throw new Error("runtimeExecutionTimesArray is null or undefined item(s)");
        }

        return RuntimeExecutionTimes.zero.add(runtimeExecutionTimesArray);
    }

    /**
     * Returns a new instance of the RuntimeExecutionTimes class this is deserialized from a delimited string.
     * @memberof RuntimeExecutionTimes
     * @instance
     */
    public static createFromDelimitedString(delimitedString: string) {
        const metrics = QueryMetricsUtils.parseDelimitedString(delimitedString);

        const vmExecutionTime =
            QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.VMExecutionTimeInMs);
        const indexLookupTime =
            QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.IndexLookupTimeInMs);
        const documentLoadTime =
            QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.DocumentLoadTimeInMs);
        const documentWriteTime =
            QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.DocumentWriteTimeInMs);

        let queryEngineExecutionTime = TimeSpan.zero;
        queryEngineExecutionTime = queryEngineExecutionTime.add(vmExecutionTime);
        queryEngineExecutionTime = queryEngineExecutionTime.subtract(indexLookupTime);
        queryEngineExecutionTime = queryEngineExecutionTime.subtract(documentLoadTime);
        queryEngineExecutionTime = queryEngineExecutionTime.subtract(documentWriteTime);
        return new RuntimeExecutionTimes(
            queryEngineExecutionTime,
            QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.SystemFunctionExecuteTimeInMs),
            QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.UserDefinedFunctionExecutionTimeInMs));
    }
}
