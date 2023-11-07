import { FC, useState } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { UpgradeModels_updateMutation } from "@/__generated__/UpgradeModels_updateMutation.graphql";
import { H2 } from "@/components/ui/Headers";
import { MutationButton } from "@/components/ui/MutationButton";
import { StyledLink } from "@/components/ui/StyledLink";
import { modelRoute } from "@/routes";
import { defaultSquiggleVersion } from "@quri/versioned-playground";
import { EditSquiggleSnippetModel } from "../models/[owner]/[slug]/EditSquiggleSnippetModel";
import { UpgradeModels$key } from "@/__generated__/UpgradeModels.graphql";
import { UpgradeModels_List$key } from "@/__generated__/UpgradeModels_List.graphql";
import { Button } from "@quri/ui";

const ModelList: FC<{ modelsRef: UpgradeModels_List$key }> = ({
  modelsRef,
}) => {
  const models = useFragment(
    graphql`
      fragment UpgradeModels_List on Model @relay(plural: true) {
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
          UpgradeModels_updateMutation,
          "AdminUpdateModelVersionResult"
        >
          expectedTypename="AdminUpdateModelVersionResult"
          mutation={graphql`
            mutation UpgradeModels_updateMutation(
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

export const UpgradeModels: FC<{
  queryRef: UpgradeModels$key;
}> = ({ queryRef }) => {
  const { modelsByVersion } = useFragment(
    graphql`
      fragment UpgradeModels on Query {
        modelsByVersion {
          version
          count
          privateCount
          models {
            ...UpgradeModels_List
          }
        }
      }
    `,
    queryRef
  );

  return (
    <div>
      <H2>Upgrade model versions</H2>
      <p>
        Check models with their current version and the new version, then press
        the upgrade button if everything is ok.
      </p>
      <p>
        <strong>
          {`Code edits won't be saved, "Upgrade" buttton bumps only the model's version.`}
        </strong>
      </p>
      <div className="space-y-8">
        {modelsByVersion.map((entry) => {
          if (
            entry.version === "dev" ||
            entry.version === defaultSquiggleVersion
          ) {
            return null;
          }
          return (
            <section key={entry.version}>
              <h3 className="font-medium text-lg text-slate-700">
                {entry.version} ({entry.count} models, {entry.privateCount}{" "}
                private models)
              </h3>
              <ModelList modelsRef={entry.models} />
            </section>
          );
        })}
      </div>
    </div>
  );
};
