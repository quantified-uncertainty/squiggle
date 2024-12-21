import {
  insertVersionToVersionedComponents,
  updateSquiggleLangVersion,
} from "../patch-js.js";

async function main() {
  const version = process.env["VERSION"];
  if (!version) {
    console.error("Expected VERSION env var");
    return;
  }

  await insertVersionToVersionedComponents(version, { skipInstall: true });
  await updateSquiggleLangVersion();
}

main();
