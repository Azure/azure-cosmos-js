const execa = require("execa");

async function exec(cmd) {
  const command = execa.shell(cmd, { cwd: "./ts-test" });
  command.stderr.pipe(process.stderr);
  command.stdout.pipe(process.stdout);
  return command;
}

(async () => {
  try {
    await exec("npm init -y");
    await exec("npm install --save ./..");
    await exec("npm install --save typescript@3.0");
    await exec("tsc ./test.ts --allowSyntheticDefaultImports true");
    await exec("npm install --save typescript@latest");
    await exec("tsc ./test.ts --allowSyntheticDefaultImports true");
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
})();
