import { readFile, writeFile } from "node:fs/promises";

import babel from "@babel/core";
import babelParser from "@babel/parser";

import { exec } from "./lib.js";

const t = babel.types;

const parserPlugins: babelParser.ParserPlugin[] = [["typescript", {}], "jsx"];

// assumes that cwd is packages/versioned-playground
export async function insertVersionToVersionedPlayground(version: string) {
  const alias = `squiggle-components-${version}`;
  await exec(`pnpm add ${alias}@npm:@quri/squiggle-components@${version}`);

  const propsIdentifier =
    "SquigglePlaygroundProps_" + version.split(".").join("_");

  {
    const filename = "src/VersionedSquigglePlayground.tsx";
    let src = await readFile(filename, "utf-8");

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
                  t.identifier("SquigglePlaygroundProps")
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
                path.node.id.name === "playgroundByVersion"
              ) {
                const entries = path.get("init.expression.properties");
                if (!Array.isArray(entries)) {
                  throw new Error("Expected an array");
                }
                const lastEntry = entries.at(-1); // dev: lazy(...)
                if (!lastEntry) {
                  throw new Error("Expected to find some entries");
                }

                const lazyImport = babelParser.parseExpression(
                  `(lazy(async () => ({
                    default: (await import("${alias}")).SquigglePlayground
                  })) as FC<${propsIdentifier}>)`,
                  { plugins: parserPlugins }
                );
                lastEntry.insertBefore(
                  t.objectProperty(t.stringLiteral(version), lazyImport)
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
                  const elements = path.get("init.expression.elements");
                  if (!Array.isArray(elements)) {
                    throw new Error("Expected an array");
                  }
                  const lastElement = elements.at(-1);
                  if (!lastElement) {
                    throw new Error("Expected to find some elements");
                  }
                  if (lastElement.toString() !== '"dev"') {
                    throw new Error("Expected 'dev' version to be last");
                  }
                  // Undocumented method, but more common `insertBefore` or `replaceWithMultiple` add extra parentheses.
                  // See also: https://stackoverflow.com/questions/55648184/babels-replacewithmultiple-adds-unnecessary-parentheses
                  lastElement.replaceInline([
                    t.stringLiteral(version),
                    t.stringLiteral("dev"),
                  ]);
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
