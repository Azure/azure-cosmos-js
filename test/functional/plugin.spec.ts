import { CosmosClient } from "../../dist-esm";
import { RequestContext } from "../../dist-esm/request/RequestContext";
import { Plugin, Next, PluginConfig } from "../../dist-esm/plugins/Plugin";

import * as assert from "assert";

describe("Plugin", function() {
  it("should handle all requests", async function() {
    const successResponse = {
      headers: {},
      code: 200,
      result: {
        message: "yay"
      }
    };
    let requestCount = 0;
    const FAILCOUNT = 2;
    const sometimesThrow: Plugin<any> = async (context: RequestContext, next: Next<any>) => {
      requestCount++;
      if (context.path.includes("dbs") && requestCount <= FAILCOUNT) {
        throw {
          code: "ECONNRESET"
        };
      }
      return successResponse;
    };

    const client = new CosmosClient({
      endpoint: "https://faaaaaaaaaaaaake.com",
      key: "THIS IS A FAKE KEY",
      plugins: [
        {
          on: "request",
          plugin: sometimesThrow
        }
      ] as PluginConfig[]
    } as any);
    const response = await client.database("foo").read();
    assert.equal(requestCount, FAILCOUNT + 1); // Get Database Account + FAILED GET Database + Get Database
    assert.notEqual(response, undefined);
    assert.equal(response.statusCode, successResponse.code);
    assert.deepEqual(response.resource, successResponse.result);
  });

  it("should handle all operations", async function() {
    const successResponse = {
      headers: {},
      code: 200,
      result: {
        message: "yay"
      }
    };
    let requestCount = 0;
    const alwaysSucceed: Plugin<any> = async (context: RequestContext, next: Next<any>) => {
      requestCount++;
      return successResponse;
    };
    const alwaysThrow: Plugin<any> = async (context: RequestContext, next: Next<any>) => {
      throw new Error("I always throw!");
    };

    const client = new CosmosClient({
      endpoint: "https://faaaaaaaaaaaaake.com",
      key: "THIS IS A FAKE KEY",
      plugins: [
        {
          on: "request",
          plugin: alwaysThrow // I'll never be called since operation will always succeed.
        },
        {
          on: "operation",
          plugin: alwaysSucceed
        }
      ] as PluginConfig[]
    } as any);
    const response = await client.database("foo").read();
    assert.equal(requestCount, 2); // Get Database Account + Get Database
    assert.notEqual(response, undefined);
    assert.equal(response.statusCode, successResponse.code);
    assert.deepEqual(response.resource, successResponse.result);
  });

  it("should allow next to be called", async function() {
    const successResponse = {
      headers: {},
      code: 200,
      result: {
        message: "yay"
      }
    };
    let innerRequestCount = 0;
    const alwaysSucceed: Plugin<any> = async (context: RequestContext, next: Next<any>) => {
      innerRequestCount++;
      return successResponse;
    };

    let requestCount = 0;
    let responseCount = 0;
    const counts: Plugin<any> = async (context: RequestContext, next: Next<any>) => {
      requestCount++;
      const response = await next(context);
      responseCount++;
      return response;
    };

    const client = new CosmosClient({
      endpoint: "https://faaaaaaaaaaaaake.com",
      key: "THIS IS A FAKE KEY",
      plugins: [
        {
          on: "operation",
          plugin: counts // I'll never be called since operation will always succeed.
        },
        {
          on: "operation",
          plugin: alwaysSucceed
        }
      ] as PluginConfig[]
    } as any);
    const response = await client.database("foo").read();
    assert.equal(requestCount, 2); // Get Database Account + Get Database
    assert.equal(responseCount, 2); // Get Database Account + Get Database
    assert.equal(innerRequestCount, 2); // Get Database Account + Get Database
    assert.notEqual(response, undefined);
    assert.equal(response.statusCode, successResponse.code);
    assert.deepEqual(response.resource, successResponse.result);
  });
});
