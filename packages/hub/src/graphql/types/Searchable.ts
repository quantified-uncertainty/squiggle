import {
  groupRoute,
  modelRoute,
  relativeValuesRoute,
  userRoute,
} from "@/routes";

import { builder } from "../builder";
import { Group } from "./Group";
import { Model } from "./Model";
import { RelativeValuesDefinition } from "./RelativeValuesDefinition";
import { User } from "./User";

type Tag = "Model" | "RelativeValuesDefinition" | "User" | "Group";

function tagged(obj: any, tag: Tag) {
  obj._searchableTag = tag;
  return obj;
}

const SearchableObject = builder.unionType("SearchableObject", {
  types: [Model, RelativeValuesDefinition, User, Group],
  resolveType: (wrappedObj) => {
    const tag: Tag = (wrappedObj as any)._searchableTag;
    switch (tag) {
      case "Model":
        return Model;
      case "RelativeValuesDefinition":
        return RelativeValuesDefinition;
      case "User":
        return User;
      case "Group":
        return Group;
      default:
        throw new Error("Incorrectly tagged object");
    }
  },
});

export const Searchable = builder.prismaNode("Searchable", {
  id: { field: "id" },
  fields: (t) => ({
    link: t.string({
      select: {
        model: {
          select: {
            owner: true,
            slug: true,
          },
        },
        definition: {
          select: { owner: true, slug: true },
        },
        user: {
          select: { asOwner: true },
        },
        group: {
          select: { asOwner: true },
        },
      },
      resolve: (object) => {
        // TODO - should be a field on object types
        switch (true) {
          case !!object.model:
            return modelRoute({
              owner: object.model.owner.slug,
              slug: object.model.slug,
            });
          case !!object.definition:
            return relativeValuesRoute({
              owner: object.definition.owner.slug,
              slug: object.definition.slug,
            });
          case !!object.user?.asOwner:
            return userRoute({ username: object.user.asOwner.slug });
          case !!object.group:
            return groupRoute({ slug: object.group.asOwner.slug });
          default:
            throw new Error("Invalid Searchable record");
        }
      },
    }),
    object: t.field({
      type: SearchableObject,
      select: {
        // TODO: queryFromInfo, https://github.com/hayes/pothos/discussions/656#discussioncomment-4823928
        model: true,
        definition: true,
        user: true,
        group: true,
      },
      resolve: (object) => {
        switch (true) {
          case !!object.model:
            return tagged(object.model, "Model");
          case !!object.definitionId:
            return tagged(object.definition, "RelativeValuesDefinition");
          case !!object.userId:
            return tagged(object.user, "User");
          case !!object.groupId:
            return tagged(object.group, "Group");
          default:
            throw new Error("Invalid Searchable record");
        }
      },
    }),
  }),
});
