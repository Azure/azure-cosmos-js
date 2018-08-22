import { MultiRegionWriteScenario } from "./MultiRegionWriteScenario";

// tslint:disable:no-console
async function run() {
  const scenarios = new MultiRegionWriteScenario();
  await scenarios.init();

  await scenarios.runBasic();
  try {
    await scenarios.runManualConflict();
  } catch (err) {
    console.error("Manual sceanrio failed");
    console.error(err);
  }
  try {
    await scenarios.runLWW();
  } catch (err) {
    console.error("LWW sceanrio failed");
    console.error(err);
  }
  try {
    await scenarios.runUDP();
  } catch (err) {
    console.error("UDP sceanrio failed");
    console.error(err);
  }
}

run().catch(console.error);
