"use client";
import { FieldPathByValue, FieldValues } from "react-hook-form";
import { useRelayEnvironment } from "react-relay";
import { fetchQuery, graphql } from "relay-runtime";

import { SelectFormField } from "@quri/ui";

import {
  SelectGroupQuery,
  SelectGroupQuery$data,
} from "@/__generated__/SelectGroupQuery.graphql";

const Query = graphql`
  query SelectGroupQuery($input: GroupsQueryInput!) {
    groups(input: $input) {
      edges {
        node {
          id
          slug
        }
      }
    }
  }
`;

export type SelectGroupOption =
  SelectGroupQuery$data["groups"]["edges"][number]["node"];

export function SelectGroup<
  TValues extends FieldValues,
  TName extends FieldPathByValue<
    TValues,
    SelectGroupOption | null
  > = FieldPathByValue<TValues, SelectGroupOption | null>,
>({
  name,
  label,
  description,
  required = true,
  myOnly = false,
}: {
  name: TName;
  label?: string;
  description?: string;
  required?: boolean;
  myOnly?: boolean;
}) {
  const environment = useRelayEnvironment();

  const loadOptions = async (
    inputValue: string
  ): Promise<SelectGroupOption[]> => {
    const result = await fetchQuery<SelectGroupQuery>(environment, Query, {
      input: {
        slugContains: inputValue,
        myOnly,
      },
    }).toPromise();

    if (!result) {
      return [];
    }

    return result.groups.edges.map((edge) => edge.node);
  };

  return (
    <SelectFormField<TValues, SelectGroupOption | null>
      name={name}
      label={label}
      description={description}
      required={required}
      async
      loadOptions={loadOptions}
      renderOption={(group) => group.slug}
    />
  );
}
