"use server";

import { z } from "zod";

import { makeServerAction } from "@/lib/server/utils";
import { checkRootUser } from "@/users/auth";

import { rebuildSearchableTable } from "../helpers";

// Admin-only query for rebuilding the search index
export const adminRebuildSearchIndexAction = makeServerAction(
  z.object({}),
  async () => {
    await checkRootUser();
    await rebuildSearchableTable();
  }
);
