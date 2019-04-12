import { Response } from "../../request";
import { ExecutionContext } from "../ExecutionContext";
import { getInitialHeader } from "../headerUtils";

/** @hidden */
export class OffsetLimitEndpointComponent implements ExecutionContext {
  /**
   * Represents an endpoint in handling top query. It only returns as many results as top arg specified.
   * @constructor TopEndpointComponent
   * @param { object } executionContext - Underlying Execution Context
   * @ignore
   */
  constructor(private executionContext: ExecutionContext, private limit: number, private offset: number) {}

  /**
   * Execute a provided function on the next element in the TopEndpointComponent.
   * @memberof TopEndpointComponent
   * @instance
   */
  public async nextItem(): Promise<Response<any>> {
    if (this.offset > 0) {
      // Grab next item but ignore the result. We only need the headers
      const { headers } = await this.executionContext.nextItem();
      this.offset--;
      return { result: undefined, headers };
    }
    if (this.limit > 0) {
      const response = await this.executionContext.nextItem();
      this.limit--;
      return response;
    }
    // If both limit and offset are 0, return nothing
    return { result: undefined, headers: getInitialHeader() };
  }

  /**
   * Retrieve the current element on the TopEndpointComponent.
   * @memberof TopEndpointComponent
   * @instance
   */
  public async current(): Promise<Response<any>> {
    if (this.offset > 0) {
      const current = await this.executionContext.current();
      return { result: undefined, headers: current.headers };
    }
    return this.executionContext.current();
  }

  /**
   * Determine if there are still remaining resources to processs.
   * @memberof TopEndpointComponent
   * @instance
   * @returns {Boolean} true if there is other elements to process in the TopEndpointComponent.
   */
  public hasMoreResults() {
    return (this.offset > 0 || this.limit > 0) && this.executionContext.hasMoreResults();
  }
}
