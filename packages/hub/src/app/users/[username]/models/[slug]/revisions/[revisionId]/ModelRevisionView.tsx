import { FC } from "react";
import { useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { StyledLink } from "@/components/ui/StyledLink";
import { commonDateFormat } from "@/lib/common";
import { modelRoute } from "@/routes";
import { ModelRevisionViewQuery } from "@gen/ModelRevisionViewQuery.graphql";
import { SquigglePlayground } from "@quri/squiggle-components";
import { format } from "date-fns";

const ModelRevisionViewQuery = graphql`
  query ModelRevisionViewQuery($input: QueryModelInput!, $revisionId: ID!) {
    model(input: $input) {
      id
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
  const data = useLazyLoadQuery<ModelRevisionViewQuery>(
    ModelRevisionViewQuery,
    {
      input: { ownerUsername: username, slug },
      revisionId,
    }
  );

  const typename = data.model.revision.content.__typename;
  if (typename !== "SquiggleSnippet") {
    return <div>Unknown model type {typename}</div>;
  }

  return (
    <div>
      <div className="mx-auto max-w-2xl mb-6">
        <div>
          <span className="text-slate-500">Version from</span>{" "}
          {format(data.model.revision.createdAtTimestamp, commonDateFormat)}
        </div>
        <StyledLink href={modelRoute({ username, slug })}>
          Go to latest version
        </StyledLink>
      </div>
      <SquigglePlayground defaultCode={data.model.revision.content.code} />
    </div>
  );
};
