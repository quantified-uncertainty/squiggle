import { readFile, writeFile } from "fs/promises";
import { toString as mdastToString } from "mdast-util-to-string";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";

function changelogFile(packageDir: string) {
  return `${packageDir}/CHANGELOG.md`;
}

export async function getChangelogText(packageDir: string) {
  return await readFile(changelogFile(packageDir), "utf-8");
}

export async function updateChangelogText(packageDir: string, text: string) {
  return await writeFile(changelogFile(packageDir), text, "utf-8");
} // Based on https://github.com/changesets/action/blob/2bb9bcbd6bf4996a55ce459a630a0aa699457f59/src/utils.ts;
// heavily modified.

export function getChangelogEntry(changelog: string, version: string) {
  const ast = unified().use(remarkParse).parse(changelog);

  const nodes = ast.children;
  let startedDepth: number | null = null;

  const pickedNodes: typeof nodes = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === "heading") {
      if (startedDepth && node.depth === startedDepth) {
        break;
      }
      const stringified: string = mdastToString(node);
      if (!startedDepth && stringified === version) {
        startedDepth = node.depth;
        continue;
      }
      if (!startedDepth) {
        continue;
      }
    }

    pickedNodes.push(node);
  }

  if (!startedDepth) {
    throw new Error(`Couldn't find ${version} entry`); // TODO - would be useful to output file name too
  }
  ast.children = pickedNodes;

  return {
    content: (unified().use(remarkStringify).stringify(ast) as string).trim(),
  };
}
