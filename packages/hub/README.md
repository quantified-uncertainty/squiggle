This is a source code for https://squigglehub.org/.

# Deployment

## Database migrations

Database migrations are created with a usual [Prisma](https://www.prisma.io/) workflow.

We don't have CI/CD for migrating the database in production yet.

To deploy a migration to the production database:

- obtain the database connection string from Digital Ocean;
- run `DATABASE_URL=... prisma migrate deploy` locally.

## Changing the database

1. Edit `schema.prisma`
2. Run ``pnpm prisma migrate dev --name [migration-name-here]
3. Run

# Development notes

[How to load GraphQL data in Next.js pages](/docs/relay-pages.md)
