import { QueryMetricsUtils } from "./queryMetricsUtils";

export class ClientSideMetrics {
    private requestCharge: number;
    constructor(requestCharge: number) {
        // Constructor
        if (!QueryMetricsUtils.isNumeric(requestCharge)) {
            throw new Error("requestCharge is not a numeric type");
        }

        this.requestCharge = requestCharge;
    }

    /**
     * Gets the RequestCharge
     * @memberof ClientSideMetrics
     * @instance
     * @ignore
     */
    public getRequestCharge() {
        return this.requestCharge;
    }

    /**
     * Adds one or more ClientSideMetrics to a copy of this instance and returns the result.
     * @memberof ClientSideMetrics
     * @instance
     */
    public add(clientSideMetricsArray: ClientSideMetrics[]) {
        if (arguments == null || arguments.length === 0) {
            throw new Error("arguments was null or empty");
        }

        clientSideMetricsArray.push(this);

        let requestCharge = 0;
        for (const clientSideMetrics of clientSideMetricsArray) {

            if (clientSideMetrics == null) {
                throw new Error("clientSideMetrics has null or undefined item(s)");
            }

            requestCharge += clientSideMetrics.requestCharge;
        }

        return new ClientSideMetrics(requestCharge);
    }

    public static readonly zero = new ClientSideMetrics(0);

    public static createFromArray(clientSideMetricsArray: ClientSideMetrics[]) {
        if (clientSideMetricsArray == null) {
            throw new Error("clientSideMetricsArray is null or undefined item(s)");
        }

        return this.zero.add(clientSideMetricsArray);
    }
}
