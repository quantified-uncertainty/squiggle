// https://github.com/changesets/changesets/blob/main/docs/modifying-changelog-format.md
// Fork of https://github.com/svitejs/changesets-changelog-github-compact/blob/b9afa3e4c42762e842a310813d42f99b0aee4b6f/packages/changesets-changelog-github-compact/src/index.ts

import type { ChangelogFunctions } from "@changesets/types";
import { getInfo, getInfoFromPullRequest } from "@changesets/get-github-info";

// can't be moved to constants.ts because it's ESM and changesets requires this file to be CJS
const REPO = "quantified-uncertainty/squiggle";

const changelogFunctions: ChangelogFunctions = {
  getDependencyReleaseLine: async (changesets, dependenciesUpdated) => {
    // Listing dependency updates adds too much noise.
    return "";
  },
  getReleaseLine: async (changeset, type) => {
    let prFromSummary: number | undefined;
    let commitFromSummary: string | undefined;

    const replacedChangelog = changeset.summary
      .replace(/^\s*(?:pr|pull|pull\s+request):\s*#?(\d+)/im, (_, pr) => {
        const num = Number(pr);
        if (!isNaN(num)) prFromSummary = num;
        return "";
      })
      .replace(/^\s*commit:\s*([^\s]+)/im, (_, commit) => {
        commitFromSummary = commit;
        return "";
      })
      .replace(/^\s*(?:author|user):\s*@?([^\s]+)/gim, "")
      .trim();

    // add links to issue hints (fix #123) => (fix [#123](https://....))
    const linkifyIssueHints = (line: string) =>
      line.replace(
        /(?<=\( ?(?:fix|fixes|see) )(#\d+)(?= ?\))/g,
        (issueHash) => {
          return `[${issueHash}](https://github.com/${REPO}/issues/${issueHash.substring(
            1
          )})`;
        }
      );
    const [firstLine, ...futureLines] = replacedChangelog
      .split("\n")
      .map((l) => linkifyIssueHints(l.trimRight()));

    const links = await (async () => {
      if (prFromSummary !== undefined) {
        let { links } = await getInfoFromPullRequest({
          repo: REPO,
          pull: prFromSummary,
        });
        if (commitFromSummary) {
          links = {
            ...links,
            commit: `[\`${commitFromSummary}\`](https://github.com/${REPO}/commit/${commitFromSummary})`,
          };
        }
        return links;
      }
      const commitToFetchFrom = commitFromSummary || changeset.commit;
      if (commitToFetchFrom) {
        const { links } = await getInfo({
          repo: REPO,
          commit: commitToFetchFrom,
        });
        return links;
      }
      return {
        commit: null,
        pull: null,
        user: null,
      };
    })();

    // only link PR or merge commit not both
    const suffix = links.pull
      ? ` (${links.pull})`
      : links.commit
      ? ` (${links.commit})`
      : "";

    return `\n- ${firstLine}${suffix}\n${futureLines
      .map((l) => `  ${l}`)
      .join("\n")}`;
  },
};

export default changelogFunctions;
