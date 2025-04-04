import { Prisma } from "@quri/hub-db";

import { prisma } from "@/lib/server/prisma";

export const selectModelRevisionBuild = {
  // Selected for `buildStatus`; will be erased later.
  // Be careful with forwarding the errors to the frontend - potential security risk, build script doesn't take `isPrivate` into account.
  errors: true,
  runSeconds: true,
} satisfies Prisma.ModelRevisionBuildSelect;

export type ModelRevisionBuildDTO = {
  // No errors here - potential security risk, build script doesn't take `isPrivate` into account.
  runSeconds: number;
};

type BuildRow = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.modelRevisionBuild.findFirst<{
        select: typeof selectModelRevisionBuild;
      }>
    >
  >
>;

export function modelRevisionBuildToDTO(
  build: BuildRow
): ModelRevisionBuildDTO {
  return {
    runSeconds: build.runSeconds,
  };
}
