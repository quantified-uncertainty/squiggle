import babel from "@babel/core";
import babelParser from "@babel/parser";
import { readFile, writeFile } from "node:fs/promises";

import { exec } from "./lib.js";
import { DEFAULT_VERSION } from "./constants";

const t = babel.types;

const parserPlugins: babelParser.ParserPlugin[] = [["typescript", {}], "jsx"];

// assumes that cwd is packages/versioned-components
export async function insertVersionToVersionedComponents(version: string) {
  const alias = `squiggle-components-${version}`;
  await exec(`pnpm add ${alias}@npm:@quri/squiggle-components@${version}`);

  for (const componentName of ["SquigglePlayground", "SquiggleChart"]) {
    const filename = `src/Versioned${componentName}.tsx`;
    let src = await readFile(filename, "utf-8");

    const propsIdentifier = `${componentName}Props_${version
      .split(".")
      .join("_")}`;

    let patchedImports = false,
      patchedComponents = false;

    const output = babel.transformSync(src, {
      parserOpts: { plugins: parserPlugins },
      plugins: [
        () => {
          const visitor: babel.Visitor = {
            ImportDeclaration(path) {
              if (path.node.source.value === "@quri/squiggle-components") {
                const specifier = t.importSpecifier(
                  t.identifier(propsIdentifier),
                  t.identifier(`${componentName}Props`)
                );
                specifier.importKind = "type";
                path.insertBefore(
                  t.importDeclaration([specifier], t.stringLiteral(alias))
                );
                patchedImports = true;
              }
            },
            VariableDeclarator(path) {
              if (
                path.node.id.type === "Identifier" &&
                path.node.id.name === "componentByVersion"
              ) {
                const entries = path.get(
                  "init.expression.expression.properties"
                );
                if (!Array.isArray(entries)) {
                  throw new Error("Expected an array");
                }
                const lastEntry = entries.at(-1); // DEFAULT_VERSION: lazy(...)
                if (!lastEntry) {
                  throw new Error("Expected to find some entries");
                }

                const lazyImport = babelParser.parseExpression(
                  `(lazy(async () => ({
                    default: (await import("${alias}")).${componentName}
                  })) as FC<${propsIdentifier}>)`,
                  { plugins: parserPlugins }
                );
                lastEntry.insertBefore(
                  t.objectProperty(t.stringLiteral(DEFAULT_VERSION), lazyImport)
                );
                patchedComponents = true;
              }
            },
          };
          return { visitor };
        },
      ],
    });

    if (!output?.code || !patchedImports || !patchedComponents) {
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
}
