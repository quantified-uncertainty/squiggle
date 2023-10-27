import { useQuery } from "@apollo/client";
import { NotFoundError } from "apollo-client/errors";
import { ListView } from "@/relative-values/components/views/ListView";
import { GET_RELATIVE_VALUES_PAGE } from "@/relative-values/graphql/queries";

export default function ModelRelativeValuesPage({ owner, slug, variableName }) {
  const { data, error } = useQuery(GET_RELATIVE_VALUES_PAGE, {
    variables: { owner, slug, variableName },
  });

  if (error) {
      if (error instanceof NotFoundError) {
        return <ErrorPage statusCode={404} message={`Page ${variableName} does not exist.`} />;
      } else {
        return <ErrorPage statusCode={500} message={`An error occurred: ${error.message}`} />;
      }
    }

  if (!data || !data.relativeValuesPage) {
      return <ErrorPage statusCode={404} message={`Page ${variableName} does not exist.`} />;
    } else {
      return <ListView data={data.relativeValuesPage} />;
    }
}
