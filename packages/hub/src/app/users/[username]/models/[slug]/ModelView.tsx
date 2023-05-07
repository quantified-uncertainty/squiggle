import { FC } from "react";
import { useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { ModelViewQuery } from "@gen/ModelViewQuery.graphql";
import { ModelForm } from "./ModelForm";

const ModelViewQuery = graphql`
  query ModelViewQuery($input: QueryModelInput!) {
    model(input: $input) {
      ...ModelFormFragment
    }
  }
`;

type Props = {
  username: string;
  slug: string;
};

export const ModelView: FC<Props> = ({ username, slug }) => {
  const data = useLazyLoadQuery<ModelViewQuery>(ModelViewQuery, {
    input: { ownerUsername: username, slug },
  });

  return <ModelForm username={username} slug={slug} model={data.model} />;
};
