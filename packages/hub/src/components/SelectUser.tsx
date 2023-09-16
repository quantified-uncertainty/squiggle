"use client";
import { FieldPathByValue, FieldValues } from "react-hook-form";
import { fetchQuery, graphql } from "relay-runtime";

import { SelectFormField } from "@quri/ui";

import {
  SelectUserQuery,
  SelectUserQuery$data,
} from "@/__generated__/SelectUserQuery.graphql";
import { useRelayEnvironment } from "react-relay";

const Query = graphql`
  query SelectUserQuery($input: UsersQueryInput!) {
    users(input: $input) {
      edges {
        node {
          id
          username
        }
      }
    }
  }
`;

export type SelectUserOption =
  SelectUserQuery$data["users"]["edges"][number]["node"];

export function SelectUser<
  TValues extends FieldValues,
  TName extends FieldPathByValue<
    TValues,
    SelectUserOption | null
  > = FieldPathByValue<TValues, SelectUserOption | null>,
>({
  name,
  label,
  required = true,
}: {
  name: TName;
  label?: string;
  required?: boolean;
}) {
  const environment = useRelayEnvironment();

  const loadOptions = async (
    inputValue: string
  ): Promise<SelectUserOption[]> => {
    const result = await fetchQuery<SelectUserQuery>(environment, Query, {
      input: {
        usernameContains: inputValue,
      },
    }).toPromise();

    if (!result) {
      return [];
    }

    return result.users.edges.map((edge) => edge.node);
  };

  return (
    <SelectFormField<TValues, SelectUserOption | null>
      name={name}
      label={label}
      required={required}
      async
      loadOptions={loadOptions}
      renderOption={(user) => user.username}
    />
  );
}
