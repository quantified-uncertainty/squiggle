import { useQuery } from "@apollo/client";
import { NotFoundError } from "graphql/errors";
import { ListView } from "@/relative-values/components/views/ListView";
import { GET_RELATIVE_VALUES_PAGE } from "@/relative-values/graphql/queries";

export default function ModelRelativeValuesPage({ owner, slug, variableName }) {
  const { data, error } = useQuery(GET_RELATIVE_VALUES_PAGE, {
    variables: { owner, slug, variableName },
  });

  if (error) {
    throw error;
  }

  if (!data || !data.relativeValuesPage) {
    return res.status(404).send({ error: `Page ${variableName} does not exist.` });
  }

  return <ListView data={data.relativeValuesPage} />;
}
