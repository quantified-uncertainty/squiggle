import { toString as mdastToString } from "mdast-util-to-string";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";

import { getChangelogText, updateChangelogText } from "./changelog-utils.js";
import { getChangedPackages } from "./package-utils.js";

async function cleanupGeneratedChangelog(packageDir: string) {
  const changelog = await getChangelogText(packageDir);
  const ast = unified().use(remarkParse).parse(changelog);

  ast.children = ast.children.filter((node) => {
    if (
      node.type === "heading" &&
      mdastToString(node).match(/(Major|Minor|Patch) Changes/) !== null
    ) {
      return false;
    }
    return true;
  });

  await updateChangelogText(
    packageDir,
    (unified().use(remarkStringify).stringify(ast) as string).trim()
  );
}

// This can't be done in `changelog.cts` callbacks yet.
// See: https://github.com/changesets/changesets/issues/995
export async function cleanupGeneratedChangelogs() {
  const packageDirs = await getChangedPackages();
  for (const packageDir of packageDirs) {
    await cleanupGeneratedChangelog(packageDir);
  }
}
