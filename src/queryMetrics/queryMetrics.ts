import { ClientSideMetrics } from "./clientSideMetrics";
import QueryMetricsConstants from "./queryMetricsConstants";
import { QueryMetricsUtils } from "./queryMetricsUtils";
import { QueryPreparationTimes } from "./queryPreparationTime";
import { RuntimeExecutionTimes } from "./runtimeExecutionTimes";
import { TimeSpan } from "./timeSpan";

export class QueryMetrics {
    private retrievedDocumentCount: number;
    private retrievedDocumentSize: number;
    private outputDocumentCount: number;
    private outputDocumentSize: number;
    private indexHitDocumentCount: number;
    private totalQueryExecutionTime: TimeSpan;
    private queryPreparationTimes: QueryPreparationTimes;
    private indexLookupTime: TimeSpan;
    private documentLoadTime: TimeSpan;
    private vmExecutionTime: TimeSpan;
    private runtimeExecutionTimes: RuntimeExecutionTimes;
    private documentWriteTime: TimeSpan;
    private clientSideMetrics: ClientSideMetrics;
    constructor(
        retrievedDocumentCount: number,
        retrievedDocumentSize: number,
        outputDocumentCount: number,
        outputDocumentSize: number,
        indexHitDocumentCount: number,
        totalQueryExecutionTime: TimeSpan,
        queryPreparationTimes: QueryPreparationTimes,
        indexLookupTime: TimeSpan,
        documentLoadTime: TimeSpan,
        vmExecutionTime: TimeSpan,
        runtimeExecutionTimes: RuntimeExecutionTimes,
        documentWriteTime: TimeSpan,
        clientSideMetrics: ClientSideMetrics) {
        // Constructor

        if (!QueryMetricsUtils.isNumeric(retrievedDocumentCount)) {
            throw new Error("retrievedDocumentCount is not a numeric type");
        }

        if (!QueryMetricsUtils.isNumeric(retrievedDocumentSize)) {
            throw new Error("retrievedDocumentSize is not a numeric type");
        }

        if (!QueryMetricsUtils.isNumeric(outputDocumentCount)) {
            throw new Error("outputDocumentCount is not a numeric type");
        }

        if (!QueryMetricsUtils.isNumeric(indexHitDocumentCount)) {
            throw new Error("indexHitDocumentCount is not a numeric type");
        }

        if (totalQueryExecutionTime == null) {
            throw new Error("totalQueryExecutionTime is null or undefined");
        }

        if (queryPreparationTimes == null) {
            throw new Error("queryPreparationTimes is null or undefined");
        }

        if (documentLoadTime == null) {
            throw new Error("documentLoadTime is null or undefined");
        }

        if (vmExecutionTime == null) {
            throw new Error("vmExecutionTime is null or undefined");
        }

        if (runtimeExecutionTimes == null) {
            throw new Error("runtimeExecutionTimes is null or undefined");
        }

        if (documentWriteTime == null) {
            throw new Error("documentWriteTime is null or undefined");
        }

        if (clientSideMetrics == null) {
            throw new Error("clientSideMetrics is null or undefined");
        }

        this.retrievedDocumentCount = retrievedDocumentCount;
        this.retrievedDocumentSize = retrievedDocumentSize;
        this.outputDocumentCount = outputDocumentCount;
        this.outputDocumentSize = outputDocumentSize;
        this.indexHitDocumentCount = indexHitDocumentCount;
        this.totalQueryExecutionTime = totalQueryExecutionTime;
        this.queryPreparationTimes = queryPreparationTimes;
        this.indexLookupTime = indexLookupTime;
        this.documentLoadTime = documentLoadTime;
        this.vmExecutionTime = vmExecutionTime;
        this.runtimeExecutionTimes = runtimeExecutionTimes;
        this.documentWriteTime = documentWriteTime;
        this.clientSideMetrics = clientSideMetrics;
    }

    /**
     * Gets the RetrievedDocumentCount
     * @instance
     * @ignore
     */
    public getRetrievedDocumentCount() {
        return this.retrievedDocumentCount;
    }

    /**
     * Gets the RetrievedDocumentSize
     * @memberof QueryMetrics
     * @instance
     * @ignore
     */
    public getRetrievedDocumentSize() {
        return this.retrievedDocumentSize;
    }

    /**
     * Gets the OutputDocumentCount
     * @memberof QueryMetrics
     * @instance
     * @ignore
     */
    public getOutputDocumentCount() {
        return this.outputDocumentCount;
    }

    /**
     * Gets the OutputDocumentSize
     * @memberof QueryMetrics
     * @instance
     * @ignore
     */
    public getOutputDocumentSize() {
        return this.outputDocumentSize;
    }

    /**
     * Gets the IndexHitDocumentCount
     * @memberof QueryMetrics
     * @instance
     * @ignore
     */
    public getIndexHitDocumentCount() {
        return this.indexHitDocumentCount;
    }

    /**
     * Gets the IndexHitRatio
     * @memberof QueryMetrics
     * @instance
     * @ignore
     */
    public getIndexHitRatio() {
        return this.retrievedDocumentCount === 0 ? 1 : this.indexHitDocumentCount / this.retrievedDocumentCount;
    }

    /**
     * Gets the TotalQueryExecutionTime
     * @memberof QueryMetrics
     * @instance
     * @ignore
     */
    public getTotalQueryExecutionTime() {
        return this.totalQueryExecutionTime;
    }

    /**
     * Gets the QueryPreparationTimes
     * @memberof QueryMetrics
     * @instance
     * @ignore
     */
    public getQueryPreparationTimes() {
        return this.queryPreparationTimes;
    }

    /**
     * Gets the IndexLookupTime
     * @memberof QueryMetrics
     * @instance
     * @ignore
     */
    public getIndexLookupTime() {
        return this.indexLookupTime;
    }

    /**
     * Gets the DocumentLoadTime
     * @memberof QueryMetrics
     * @instance
     * @ignore
     */
    public getDocumentLoadTime() {
        return this.documentLoadTime;
    }

    /**
     * Gets the VmExecutionTime
     * @memberof QueryMetrics
     * @instance
     * @ignore
     */
    public getVMExecutionTime() {
        return this.vmExecutionTime;
    }

    /**
     * Gets the RuntimeExecutionTimes
     * @memberof QueryMetrics
     * @instance
     * @ignore
     */
    public getRuntimeExecutionTimes() {
        return this.runtimeExecutionTimes;
    }

    /**
     * Gets the DocumentWriteTime
     * @memberof QueryMetrics
     * @instance
     * @ignore
     */
    public getDocumentWriteTime() {
        return this.documentWriteTime;
    }

    /**
     * Gets the ClientSideMetrics
     * @memberof QueryMetrics
     * @instance
     * @ignore
     */
    public getClientSideMetrics() {
        return this.clientSideMetrics;
    }

    /**
     * returns a new QueryMetrics instance that is the addition of this and the arguments.
     * @memberof QueryMetrics
     * @instances
     */
    public add(queryMetricsArray: QueryMetrics[]) {
        if (arguments == null || arguments.length === 0) {
            throw new Error("arguments was null or empty");
        }

        let retrievedDocumentCount = 0;
        let retrievedDocumentSize = 0;
        let outputDocumentCount = 0;
        let outputDocumentSize = 0;
        let indexHitDocumentCount = 0;
        let totalQueryExecutionTime = TimeSpan.zero;
        const queryPreparationTimesArray = [];
        let indexLookupTime = TimeSpan.zero;
        let documentLoadTime = TimeSpan.zero;
        let vmExecutionTime = TimeSpan.zero;
        const runtimeExecutionTimesArray = [];
        let documentWriteTime = TimeSpan.zero;
        const clientSideQueryMetricsArray = [];

        queryMetricsArray.push(this);

        for (const queryMetrics of queryMetricsArray) {

            if (queryMetrics == null) {
                throw new Error("queryMetricsArray has null or undefined item(s)");
            }

            retrievedDocumentCount += queryMetrics.retrievedDocumentCount;
            retrievedDocumentSize += queryMetrics.retrievedDocumentSize;
            outputDocumentCount += queryMetrics.outputDocumentCount;
            outputDocumentSize += queryMetrics.outputDocumentSize;
            indexHitDocumentCount += queryMetrics.indexHitDocumentCount;
            totalQueryExecutionTime = totalQueryExecutionTime.add(queryMetrics.totalQueryExecutionTime);
            queryPreparationTimesArray.push(queryMetrics.queryPreparationTimes);
            indexLookupTime = indexLookupTime.add(queryMetrics.indexLookupTime);
            documentLoadTime = documentLoadTime.add(queryMetrics.documentLoadTime);
            vmExecutionTime = vmExecutionTime.add(queryMetrics.vmExecutionTime);
            runtimeExecutionTimesArray.push(queryMetrics.runtimeExecutionTimes);
            documentWriteTime = documentWriteTime.add(queryMetrics.documentWriteTime);
            clientSideQueryMetricsArray.push(queryMetrics.clientSideMetrics);
        }

        return new QueryMetrics(
            retrievedDocumentCount,
            retrievedDocumentSize,
            outputDocumentCount,
            outputDocumentSize,
            indexHitDocumentCount,
            totalQueryExecutionTime,
            QueryPreparationTimes.createFromArray(queryPreparationTimesArray),
            indexLookupTime,
            documentLoadTime,
            vmExecutionTime,
            RuntimeExecutionTimes.createFromArray(runtimeExecutionTimesArray),
            documentWriteTime,
            ClientSideMetrics.createFromArray(clientSideQueryMetricsArray));
    }

    /**
     * Output the QueryMetrics as a delimited string.
     * @memberof QueryMetrics
     * @instance
     * @ignore
     */
    public toDelimitedString() {
        return QueryMetricsConstants.RetrievedDocumentCount + "=" + this.retrievedDocumentCount + ";"
            + QueryMetricsConstants.RetrievedDocumentSize + "=" + this.retrievedDocumentSize + ";"
            + QueryMetricsConstants.OutputDocumentCount + "=" + this.outputDocumentCount + ";"
            + QueryMetricsConstants.OutputDocumentSize + "=" + this.outputDocumentSize + ";"
            + QueryMetricsConstants.IndexHitRatio + "=" + this.getIndexHitRatio() + ";"
            + QueryMetricsConstants.TotalQueryExecutionTimeInMs +
            "=" + this.totalQueryExecutionTime.totalMilliseconds() + ";"
            + this.queryPreparationTimes.toDelimitedString() + ";"
            + QueryMetricsConstants.IndexLookupTimeInMs + "=" + this.indexLookupTime.totalMilliseconds() + ";"
            + QueryMetricsConstants.DocumentLoadTimeInMs + "=" + this.documentLoadTime.totalMilliseconds() + ";"
            + QueryMetricsConstants.VMExecutionTimeInMs + "=" + this.vmExecutionTime.totalMilliseconds() + ";"
            + this.runtimeExecutionTimes.toDelimitedString() + ";"
            + QueryMetricsConstants.DocumentWriteTimeInMs + "=" + this.documentWriteTime.totalMilliseconds();
    }

    public static readonly zero = new QueryMetrics(
        0, 0, 0, 0, 0, TimeSpan.zero, QueryPreparationTimes.zero, TimeSpan.zero,
        TimeSpan.zero, TimeSpan.zero, RuntimeExecutionTimes.zero, TimeSpan.zero, ClientSideMetrics.zero);

    /**
     * Returns a new instance of the QueryMetrics class that is the aggregation of an array of query metrics.
     * @memberof QueryMetrics
     * @instance
     */
    public static createFromArray(queryMetricsArray: QueryMetrics[]) {
        if (queryMetricsArray == null) {
            throw new Error("queryMetricsArray is null or undefined item(s)");
        }

        return QueryMetrics.zero.add(queryMetricsArray);
    }

    /**
     * Returns a new instance of the QueryMetrics class this is deserialized from a delimited string.
     * @memberof QueryMetrics
     * @instance
     */
    public static createFromDelimitedString(delimitedString: string, clientSideMetrics?: ClientSideMetrics) {
        const metrics = QueryMetricsUtils.parseDelimitedString(delimitedString);

        const indexHitRatio = metrics[QueryMetricsConstants.IndexHitRatio] || 0;
        const retrievedDocumentCount = metrics[QueryMetricsConstants.RetrievedDocumentCount] || 0;
        const indexHitCount = indexHitRatio * retrievedDocumentCount;
        const outputDocumentCount = metrics[QueryMetricsConstants.OutputDocumentCount] || 0;
        const outputDocumentSize = metrics[QueryMetricsConstants.OutputDocumentSize] || 0;
        const retrievedDocumentSize = metrics[QueryMetricsConstants.RetrievedDocumentSize] || 0;
        const totalQueryExecutionTime =
            QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.TotalQueryExecutionTimeInMs);
        return new QueryMetrics(
            retrievedDocumentCount,
            retrievedDocumentSize,
            outputDocumentCount,
            outputDocumentSize,
            indexHitCount,
            totalQueryExecutionTime,
            QueryPreparationTimes.createFromDelimitedString(delimitedString),
            QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.IndexLookupTimeInMs),
            QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.DocumentLoadTimeInMs),
            QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.VMExecutionTimeInMs),
            RuntimeExecutionTimes.createFromDelimitedString(delimitedString),
            QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.DocumentWriteTimeInMs),
            clientSideMetrics || ClientSideMetrics.zero);
    }
}
