"use server";

import { z } from "zod";

import { checkRootUser } from "@/server/users/auth";
import { makeServerAction } from "@/server/utils";

import { rebuildSearchableTable } from "../helpers";

// Admin-only query for rebuilding the search index
export const adminRebuildSearchIndexAction = makeServerAction(
  z.object({}),
  async () => {
    await checkRootUser();
    await rebuildSearchableTable();
  }
);
