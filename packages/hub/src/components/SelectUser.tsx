"use client";
import { FieldPathByValue, FieldValues } from "react-hook-form";
import { useRelayEnvironment } from "react-relay";
import { fetchQuery, graphql } from "relay-runtime";

import { SelectFormField } from "@quri/ui";

import {
  SelectUserQuery,
  SelectUserQuery$data,
} from "@/__generated__/SelectUserQuery.graphql";

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

export function SelectUser<TValues extends FieldValues>({
  name,
  label,
  required = true,
}: {
  name: FieldPathByValue<TValues, SelectUserOption | null>;
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
