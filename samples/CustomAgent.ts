import { finish, handleError, logStep, logSampleHeader } from "./Shared/handleError";
import { CosmosClient } from "../dist";
import { database as databaseId, container as containerId, endpoint, key } from "./Shared/config";
import { Agent } from "https";
import ProxyAgent from "proxy-agent";

logSampleHeader("Custom Agent");

// It is possible to control HTTP level behavior of the SDK client by passing a custom HTTP or HTTPS agent.
// Most often this is used for proxies.
// Passing a custom agent works only in node.js

// Establish a new custom agent with keepAlive: false. By default the SDK has keepAlive: true to improve performance
const agent = new Agent({ keepAlive: false });

// Establish a new instance of the CosmosClient with a custom agent
const client = new CosmosClient({ endpoint, key, agent });

// Establish an agent that proxies HTTP requests
const proxyAgent = new ProxyAgent(`https://your-custom-proxy.com`) as any;

// Establish a new instance of the CosmosClient to communicate through a proxy
const clientWithProxy = new CosmosClient({ endpoint, key, agent: proxyAgent });
