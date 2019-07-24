import debugLib from "debug";

const cosmosLevelFilter = process.env.COSMOS_LOG_LEVEL || "error|warn";

/** @hidden */
const cosmosDebug = debugLib("cosmos");

/** @hidden */
export type logLevel = "silly" | "debug" | "info" | "warn" | "error";

/** @hidden */
export const logger = (namespace: string) => {
  return (level: logLevel, message: string | { [key: string]: any }) => {
    if (cosmosLevelFilter.includes(level)) {
      cosmosDebug("[" + new Date().toISOString() + "][" + level + "][" + namespace + "]: %o", message);
    }
  };
};
