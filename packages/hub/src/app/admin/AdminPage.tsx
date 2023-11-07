"use client";

import { AdminPageQuery } from "@/__generated__/AdminPageQuery.graphql";
import { AdminPage_updateMutation } from "@/__generated__/AdminPage_updateMutation.graphql";
import { H1, H2 } from "@/components/ui/Headers";
import { MutationButton } from "@/components/ui/MutationButton";
import { StyledLink } from "@/components/ui/StyledLink";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { modelRoute } from "@/routes";
import { LockIcon } from "@quri/ui";
import { defaultSquiggleVersion } from "@quri/versioned-playground";
import { useSession } from "next-auth/react";
import { FC } from "react";
import { graphql } from "relay-runtime";
import { EditSquiggleSnippetModel } from "../models/[owner]/[slug]/EditSquiggleSnippetModel";

const Query = graphql`
  query AdminPageQuery {
    modelsByVersion {
      version
      count
      privateCount
      models {
        id
        slug
        owner {
          id
          slug
        }
        ...EditSquiggleSnippetModel
      }
    }
  }
`;

export const AdminPage: FC<{
  query: SerializablePreloadedQuery<AdminPageQuery>;
}> = ({ query }) => {
  useSession({ required: true });

  const [{ modelsByVersion }] = usePageQuery(Query, query);

  return (
    <div>
      <H1>
        <div className="flex gap-1 items-center">
          <LockIcon />
          <span>Admin console</span>
        </div>
      </H1>
      <H2>Upgrade model versions</H2>
      <p>
        Check models with their current version and the new version, then press
        the upgrade button if everything is ok.
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
              {entry.models.map((model) => (
                <div key={model.id}>
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
                      AdminPage_updateMutation,
                      "AdminUpdateModelVersionResult"
                    >
                      expectedTypename="AdminUpdateModelVersionResult"
                      mutation={graphql`
                        mutation AdminPage_updateMutation(
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
                    />
                  </div>
                  <EditSquiggleSnippetModel
                    key={model.id}
                    modelRef={model}
                    forceVersionPicker
                  />
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
};
