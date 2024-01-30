import babel from "@babel/core";
import babelParser from "@babel/parser";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { exec } from "./lib.js";

const repoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);

// From https://github.com/babel/babel/blob/0e5ae8de66d5c1e9ecc3f94daa5bd5d3a920e5a4/packages/babel-plugin-proposal-import-defer/src/index.ts#L14; helps with assertions.
const t: typeof babel.types = babel.types;

const parserPlugins: babelParser.ParserPlugin[] = [
  ["typescript", {}],
  "topLevelAwait",
  "jsx",
];

export async function insertVersionToVersionedComponents(
  version: string,
  opts: {
    // for debugging
    skipInstall?: boolean;
  } = {}
) {
  // `using` (https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/#using-declarations-and-explicit-resource-management) would be nice to back up cwd.
  const oldCwd = process.cwd();
  process.chdir(path.join(repoRoot, "packages/versioned-components"));

  if (!opts.skipInstall) {
    for (const name of ["lang", "components"]) {
      const alias = `squiggle-${name}-${version}`;
      await exec(`pnpm add ${alias}@npm:@quri/squiggle-${name}@${version}`);
    }
  }

  for (const name of ["lang", "components"]) {
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

    const filename = `src/versionedSquiggle${capitalizedName}.ts`;
    let src = await readFile(filename, "utf-8");

    let patchedImportTypes = false,
      patchedImports = false;

    const output = babel.transformSync(src, {
      parserOpts: { plugins: parserPlugins },
      plugins: [
        () => {
          const visitor: babel.Visitor = {
            TSTypeAliasDeclaration(path) {
              if (
                path.get("id").node.name !==
                `Squiggle${capitalizedName}PackageTypes`
              ) {
                return;
              }
              const members = path.get("typeAnnotation.members");
              if (!Array.isArray(members)) {
                throw new Error("Expected an array");
              }

              const tmpExpression = babelParser.parseExpression(
                `undefined as GetImportType<typeof import("squiggle-${name}-${version}")>`,
                { plugins: parserPlugins }
              );
              t.assertTSAsExpression(tmpExpression);
              t.assertTSType(tmpExpression.typeAnnotation);

              members
                .at(-1)
                ?.insertBefore(
                  t.tsPropertySignature(
                    t.stringLiteral(version),
                    t.tSTypeAnnotation(tmpExpression.typeAnnotation)
                  )
                );
              patchedImportTypes = true;
            },
            FunctionDeclaration(path) {
              if (
                path.get("id").node?.name !==
                `squiggle${capitalizedName}ByVersion`
              ) {
                return;
              }

              path.traverse({
                SwitchStatement(path) {
                  const cases = path.get("cases");

                  const devCase = cases.at(-2);
                  if (!devCase) {
                    throw new Error("Expected to find at least two cases");
                  }
                  const devCaseTest = devCase.get("test").node;
                  t.assertStringLiteral(devCaseTest);
                  if (devCaseTest.value !== "dev") {
                    throw new Error(
                      `Expected dev case, got: ${devCaseTest.value}`
                    );
                  }

                  const newReturn = babelParser.parseExpression(
                    `(await import("squiggle-${name}-${version}")) as unknown as Squiggle${capitalizedName}PackageTypes[T]`,
                    { plugins: parserPlugins, allowAwaitOutsideFunction: true }
                  );
                  if (!newReturn) {
                    throw new Error("Failed to parse new case code");
                  }

                  devCase.insertBefore(
                    t.switchCase(t.stringLiteral(version), [
                      t.returnStatement(newReturn),
                    ])
                  );

                  patchedImports = true;
                },
              });
            },
          };
          return { visitor };
        },
      ],
    });

    console.log(output?.code);

    if (!output?.code || !patchedImportTypes || !patchedImports) {
      throw new Error(`Failed to transform ${filename}`);
    }

    await writeFile(filename, output.code, "utf-8");
  }

  {
    const filename = "src/versions.ts";
    let src = await readFile(filename, "utf-8");

    let patchedVersions = false,
      patchedDefaultVersion = false;

    const output = babel.transformSync(src, {
      parserOpts: { plugins: parserPlugins },
      plugins: [
        () => {
          const visitor: babel.Visitor = {
            VariableDeclarator(path) {
              if (path.node.id.type !== "Identifier") {
                return;
              }
              switch (path.node.id.name) {
                case "squiggleVersions":
                  const container = path.get("init.expression");
                  if (
                    Array.isArray(container) ||
                    !container.isArrayExpression()
                  ) {
                    throw new Error("Expected an element");
                  }

                  container.unshiftContainer(
                    "elements",
                    t.stringLiteral(version)
                  );
                  patchedVersions = true;
                  break;
                case "defaultSquiggleVersion":
                  path.node.init = t.stringLiteral(version);
                  patchedDefaultVersion = true;
                  break;
              }
            },
          };

          return { visitor };
        },
      ],
    });

    if (!output?.code || !patchedVersions || !patchedDefaultVersion) {
      throw new Error(`Failed to transform ${filename}`);
    }

    await writeFile(filename, output.code, "utf-8");
  }

  await exec("pnpm format");
  process.chdir(oldCwd);
}

// Update `System.version` value in squiggle-lang.
// Always updates to the current version from `package.json`.
export async function updateSquiggleLangVersion() {
  const packageRoot = path.join(repoRoot, "packages/squiggle-lang");

  const packageJson = await readFile(
    path.join(packageRoot, "package.json"),
    "utf-8"
  );
  const { version } = JSON.parse(packageJson);

  const filename = path.join(packageRoot, "src/library/version.ts");
  let src = await readFile(filename, "utf-8");

  let patchedVersion = false;

  const output = babel.transformSync(src, {
    parserOpts: { plugins: parserPlugins },
    plugins: [
      () => {
        const visitor: babel.Visitor = {
          VariableDeclarator(path) {
            if (
              path.node.id.type === "Identifier" &&
              path.node.id.name === "VERSION"
            ) {
              path.node.init = t.stringLiteral(version);
              patchedVersion = true;
            }
          },
        };
        return { visitor };
      },
    ],
  });

  if (!output?.code || !patchedVersion) {
    throw new Error(`Failed to transform ${filename}`);
  }

  await writeFile(filename, output.code, "utf-8");
  await exec(`cd ${packageRoot} && npx prettier --write ${filename}`);
}
