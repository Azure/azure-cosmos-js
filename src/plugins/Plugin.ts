import { RequestContext } from "../request/RequestContext";
import { Response } from "../request/Response";

export enum PluginOn {
  request = "request",
  operation = "operation"
}

export interface PluginConfig {
  on: keyof typeof PluginOn;
  plugin: Plugin<any>;
}

export type Plugin<T> = (
  context: RequestContext,
  next: (context: RequestContext) => Promise<Response<T>>
) => Promise<Response<T>>;

export async function executePlugins(
  requestContext: RequestContext,
  next: Plugin<any>,
  on: PluginOn
): Promise<Response<any>> {
  if (!requestContext.plugins) {
    return next(requestContext, undefined);
  }
  let level = 0;
  function _(inner: RequestContext): Promise<Response<any>> {
    if (++level >= inner.plugins.length) {
      return next(requestContext, undefined);
    } else if (inner.plugins[level].on !== on) {
      return _(requestContext);
    } else {
      return inner.plugins[level].plugin(inner, _);
    }
  }
  if (requestContext.plugins[level].on !== on) {
    return _(requestContext);
  } else {
    return requestContext.plugins[level].plugin(requestContext, _);
  }
}

// const client = new CosmosClient({
//   plugins: [
//     {
//       on: "Request",
//       plugin: (requestContext: RequestContext, next: Plugin['next']) => {
//         console.log(requestContext.endpoint);
//         return next(requestContext);
//       }
//     },
//     {
//       on: "Request",
//       plugin: async (requestContext: RequestContext, next: Plugin['next']') => {
//         const response = await next(requestContext);
//         console.log(response.headers.requestUnits);
//         return response;
//       }
//     }
//   ]
// });
