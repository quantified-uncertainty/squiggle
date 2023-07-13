import { FC } from "react";
import { useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { StyledLink } from "@/components/ui/StyledLink";
import { commonDateFormat } from "@/lib/common";
import { modelRoute } from "@/routes";
import { ModelRevisionViewQuery } from "@gen/ModelRevisionViewQuery.graphql";
import { SquigglePlayground } from "@quri/squiggle-components";
import { format } from "date-fns";
import { notFound } from "next/navigation";

const ModelRevisionViewQuery = graphql`
  query ModelRevisionViewQuery($input: QueryModelInput!, $revisionId: ID!) {
    result: model(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on NotFoundError {
        message
      }
      ... on Model {
        id
        ...FixModelUrlCasing
        revision(id: $revisionId) {
          createdAtTimestamp
          content {
            __typename
            ... on SquiggleSnippet {
              code
            }
          }
        }
      }
    }
  }
`;

type Props = {
  username: string;
  slug: string;
  revisionId: string;
};

export const ModelRevisionView: FC<Props> = ({
  username,
  slug,
  revisionId,
}) => {
  const { result } = useLazyLoadQuery<ModelRevisionViewQuery>(
    ModelRevisionViewQuery,
    {
      input: { ownerUsername: username, slug },
      revisionId,
    }
  );
  if (result.__typename === "NotFoundError") {
    notFound();
  }
  if (result.__typename === "BaseError") {
    throw new Error(result.message);
  }
  if (result.__typename !== "Model") {
    throw new Error("Unexpected typename");
  }
  const model = result;

  const typename = model.revision.content.__typename;
  if (typename !== "SquiggleSnippet") {
    return <div>Unknown model type {typename}</div>;
  }

  return (
    <div>
      <div className="border-b border-gray-300">
        <div className="pt-4 pb-8 px-8">
          <div>
            <span className="text-slate-500">Version from</span>{" "}
            {format(model.revision.createdAtTimestamp, commonDateFormat)}
          </div>
          <StyledLink href={modelRoute({ username, slug })}>
            Go to latest version
          </StyledLink>
        </div>
      </div>
      <SquigglePlayground defaultCode={model.revision.content.code} />
    </div>
  );
};
