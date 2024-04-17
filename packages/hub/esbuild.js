const esbuild = require("esbuild");

for (const name of [
  "buildRecentModelRevision/worker",
  "buildRecentModelRevision/main",
]) {
  esbuild.buildSync({
    entryPoints: [`./src/scripts/${name}.ts`],
    platform: "node",
    sourcemap: true,
    minify: true,
    bundle: true,
    outfile: `./dist/${name}.js`,
  });
}
