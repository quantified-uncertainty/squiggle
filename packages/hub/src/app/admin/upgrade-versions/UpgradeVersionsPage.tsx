"use client";
import { FC, useState } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
} from "@quri/ui";
import { defaultSquiggleVersion } from "@quri/versioned-squiggle-components";

import { H2 } from "@/components/ui/Headers";
import { MutationButton } from "@/components/ui/MutationButton";
import { StyledLink } from "@/components/ui/StyledLink";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { modelRoute } from "@/routes";

import { EditSquiggleSnippetModel } from "../../models/[owner]/[slug]/EditSquiggleSnippetModel";

import { UpgradeVersionsPage_List$key } from "@/__generated__/UpgradeVersionsPage_List.graphql";
import { UpgradeVersionsPage_updateMutation } from "@/__generated__/UpgradeVersionsPage_updateMutation.graphql";
import { UpgradeVersionsPageQuery } from "@/__generated__/UpgradeVersionsPageQuery.graphql";

const ModelList: FC<{ modelsRef: UpgradeVersionsPage_List$key }> = ({
  modelsRef,
}) => {
  const models = useFragment(
    graphql`
      fragment UpgradeVersionsPage_List on Model @relay(plural: true) {
        id
        slug
        owner {
          id
          slug
        }
        ...EditSquiggleSnippetModel
      }
    `,
    modelsRef
  );

  const [pos, setPos] = useState(0);

  if (!models.length) return null;
  const usedPos = Math.min(pos, models.length - 1);
  const model = models[usedPos];

  return (
    <div>
      <div className="flex gap-2 items-center">
        <div>
          Model:{" "}
          <StyledLink
            href={modelRoute({
              owner: model.owner.slug,
              slug: model.slug,
            })}
          >
            {model.owner.slug}/{model.slug}
          </StyledLink>
        </div>
        <MutationButton<
          UpgradeVersionsPage_updateMutation,
          "AdminUpdateModelVersionResult"
        >
          expectedTypename="AdminUpdateModelVersionResult"
          mutation={graphql`
            mutation UpgradeVersionsPage_updateMutation(
              $input: MutationAdminUpdateModelVersionInput!
            ) {
              result: adminUpdateModelVersion(input: $input) {
                __typename
                ... on BaseError {
                  message
                }
                ... on AdminUpdateModelVersionResult {
                  model {
                    ...EditSquiggleSnippetModel
                  }
                }
              }
            }
          `}
          updater={() => {
            // reload() from usePageQuery doesn't work for some reason
            window.location.reload();
          }}
          variables={{
            input: {
              modelId: model.id,
              version: defaultSquiggleVersion,
            },
          }}
          title={`Upgrade to ${defaultSquiggleVersion}`}
          theme="primary"
        />
        <Button onClick={() => setPos(usedPos - 1)} disabled={usedPos <= 0}>
          &larr; Prev
        </Button>
        <Button
          onClick={() => setPos(usedPos + 1)}
          disabled={usedPos >= models.length - 1}
        >
          Next &rarr;
        </Button>
      </div>
      <EditSquiggleSnippetModel
        key={model.id}
        modelRef={model}
        forceVersionPicker
      />
    </div>
  );
};

export const UpgradeVersionsPage: FC<{
  query: SerializablePreloadedQuery<UpgradeVersionsPageQuery>;
}> = ({ query }) => {
  // TODO - this fetches all models even if we show just one, can we optimize it?
  const [{ modelsByVersion }] = usePageQuery(
    graphql`
      query UpgradeVersionsPageQuery {
        modelsByVersion {
          version
          count
          privateCount
          models {
            ...UpgradeVersionsPage_List
          }
        }
      }
    `,
    query
  );

  type Entry = (typeof upgradeableModelsByVersion)[number];

  const upgradeableModelsByVersion = modelsByVersion.filter(
    (entry) =>
      entry.version !== "dev" && entry.version !== defaultSquiggleVersion
  );

  const [selectedVersion, setSelectedVersion] = useState(
    upgradeableModelsByVersion.at(0)?.version
  );

  const getEntryTitle = (entry: Entry) =>
    `${entry.version} (${entry.count} models, ${entry.privateCount} private)`;

  const getEntryByVersion = (version: string): Entry | undefined =>
    modelsByVersion.find((entry) => entry.version === version);

  const selectedEntry = selectedVersion
    ? getEntryByVersion(selectedVersion)
    : undefined;

  const devCount = getEntryByVersion("dev")?.models.length ?? 0;
  const latestCount =
    getEntryByVersion(defaultSquiggleVersion)?.models.length ?? 0;

  return (
    <div>
      <H2>Upgrade model versions</H2>
      <div className="text-xs">
        <p className="text-xs">
          Check models with their current version and the new version, then
          press the upgrade button if everything is ok.
        </p>
        <p>
          <strong>
            {`Code edits won't be saved, "Upgrade" button bumps only the model's version.`}
          </strong>
        </p>
      </div>
      <div className="text-sm mt-2">
        <div>Dev models: {devCount}</div>
        <div>
          {defaultSquiggleVersion} models: {latestCount}
        </div>
      </div>
      <div className="flex py-4">
        <Dropdown
          render={({ close }) => (
            <DropdownMenu>
              {upgradeableModelsByVersion.map((entry) => {
                return (
                  <DropdownMenuActionItem
                    key={entry.version}
                    title={getEntryTitle(entry)}
                    onClick={() => {
                      setSelectedVersion(entry.version);
                      close();
                    }}
                  />
                );
              })}
            </DropdownMenu>
          )}
        >
          <Button theme="primary">
            {selectedEntry ? getEntryTitle(selectedEntry) : "Pick a version"}
          </Button>
        </Dropdown>
      </div>
      {selectedEntry ? <ModelList modelsRef={selectedEntry.models} /> : null}
    </div>
  );
};
