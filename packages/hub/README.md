This is a source code for https://squigglehub.org/.

# Deployment

## Database migrations

Database migrations are created with a usual [Prisma](https://www.prisma.io/) workflow.

We don't have CI/CD for migrating the database in production yet.

To deploy a migration to the production database:

1. obtain the database connection string from Digital Ocean;
2. Make sure `DATABASE_URL=YOUR_URL` is stored in an `.env` file at the root of this lib.
3. If developing on the migration, use `prisma migrate dev`.
4. If using production or fully migrating your `development` environment, use `prisma migrate deploy`.

Note: Your `DATABASE_URL` for `development` likely looks something like, `postgres://postgres@localhost:5432/[db-name-here]`

## Changing the database

1. Edit `schema.prisma`
2. Run ``pnpm prisma migrate dev --name [migration-name-here]

## Notes on changing the schema

Editing the schema is suprisingly annoying. Make sure to follow these specific steps.

1. Edit `schema.prisma`, and edit the query/mutations functions.
2. Run `pnpm run gen`, to generate new TS types for the prisma file.
3. Try adding the type has been added in `builder.prismaNode("NameHere", {...types` somewhere that gets read, somewhere in `/graphql/types`. It should not find the type with Typescript yet. This will be used to update `schema.graphql`.
4. Restart the Typescript Server `> Typescript: Restart TS Server`. If this option doesn't show, try changing tabs. Now, it should show up in `graphql/types/[your file]`. Now, you should see the correct types in `/graphql/types/`.
5. Run `pnpm run gen` again.
6. Check `schema.graphql`. After step 5, this should get updated. Do not change this file manually.

The Typescript language server will frequently get out of date when editing the schema. You can update use VS Code (control-shift-p) to force a restart. You might want to update the Prisma language server too. You can also just try to get everything right, run `pnpm run gen`, and reload files, sometimes that fixes things.

# Development notes

[How to load GraphQL data in Next.js pages](/docs/relay-pages.md)

# Development Env Variables

There are some key environment variables you will need to use. Here's an example:

```
DATABASE_URL=postgres://postgres@localhost:5432/[your-db-name]
NEXTAUTH_URL=http://localhost:3001
SENDGRID_KEY=
EMAIL_FROM=dev@squigglehub.org // doesn't matter too much.
ROOT_EMAILS=[your-email] // email of the root user on Squiggle Hub, to get extra permissions
```
