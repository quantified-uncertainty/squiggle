"use server";

import { z } from "zod";

import { actionClient } from "@/lib/server/utils";
import { checkRootUser } from "@/users/auth";

import { rebuildSearchableTable } from "../helpers";

// Admin-only query for rebuilding the search index
export const adminRebuildSearchIndexAction = actionClient
  .schema(z.object({}))
  .action(async () => {
    await checkRootUser();
    await rebuildSearchableTable();
    return { ok: true };
  });
