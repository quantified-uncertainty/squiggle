import { Prisma } from "@quri/hub-db";

import { prisma } from "@/lib/server/prisma";

export const selectModelRevisionBuild = {
  errors: true,
  runSeconds: true,
} satisfies Prisma.ModelRevisionBuildSelect;

export type ModelRevisionBuildDTO = {
  runSeconds: number;
  errors: string[];
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
    errors: build.errors,
  };
}
