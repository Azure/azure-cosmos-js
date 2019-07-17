import { Agent } from "http";
import { isNode } from "../common";

/**
 * @ignore
 */
export let defaultHttpAgent: Agent;
/**
 * @ignore
 */
export let defaultHttpsAgent: Agent;

if (isNode) {
  // tslint:disable-next-line:no-eval
  const https = eval("require")("https");
  defaultHttpsAgent = new https.Agent({
    keepAlive: true
  });
  // tslint:disable-next-line:no-eval
  const http = eval("require")("http");
  defaultHttpAgent = new http.Agent({
    keepAlive: true
  });
}
