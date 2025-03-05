This package exists to provide a shared database layer for the hub web application and possible backend scripts.

## Migrating the development database

Database migrations are created with a usual [Prisma](https://www.prisma.io/) workflow.

Run `pnpm prisma migrate dev` once to create the necessary tables in the database.

When you pull new changes from GitHub that include more migrations, you'll have to run `pnpm prisma migrate dev` again.

## Changing the database

You should usually prototype schema changes with `pnpm prisma db push`, as described in [Prisma docs](https://www.prisma.io/docs/orm/prisma-migrate/workflows/prototyping-your-schema).

The basic loop is:

1. Edit `schema.prisma`
2. Run `pnpm prisma db push`
3. Check the results; repeat from step 1 until your branch is ready.
4. Run `pnpm prisma migrate dev --name [migration-name-here]` to create a migration when your schema changes have stabilized.
5. (Optional) Update the migration file if necessary; one common scenario is if you want to add a new non-nullable column, then you'll have to do first `ALTER TABLE` to a nullable column, then `UPDATE` it with the default value, and then `ALTER TABLE` to non-nullable value again.

## Notes on changing the schema

`pnpm gen` generates `@prisma/client` from `prisma/schema.prisma`.

If it looks like VS Code doesn't see your latest changes, try this:

1. Run `pnpm gen`.
2. Invoke `> TypeScript: Restart TS Server` in VS Code (you should be editing any `.ts` or `.tsx` file for this command to show)

Note: the "Restart TS Server" step is necessary because `@prisma/client` code is out of the main source tree, and VS Code won't notice that it has updated. But restarting TS Server is slow, so a better solution is to keep `@prisma/client` source code open (open `src/prisma.ts`, then "Go to definition" on `PrismaClient`). Then VS Code will watch it for changes.

## Other notes

[Common workflow for updating Prisma schema](https://www.prisma.io/docs/orm/prisma-migrate/workflows/prototyping-your-schema)
