const execa = require("execa");

async function exec(cmd) {
  const command = execa.shell(cmd, { cwd: "./tsc-test" });
  command.stderr.pipe(process.stderr);
  command.stdout.pipe(process.stdout);
  return command;
}

(async () => {
  try {
    await exec("npm init -y");
    await exec("npm install --save ./..");
    await exec("npx -p typescript@3.0 tsc ./test.ts --allowSyntheticDefaultImports true");
    await exec("npx -p typescript@latest tsc ./test.ts --allowSyntheticDefaultImports true");
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
})();
