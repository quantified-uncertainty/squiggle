This is a source code for https://squigglehub.org/.

# Deployment

## Database migrations

Database migrations are created with a usual [Prisma](https://www.prisma.io/) workflow.

We don't have CI/CD for migrating the database in production yet.

To deploy a migration to the production database:

- obtain the database connection string from Digital Ocean;
- run `DATABASE_URL=... prisma migrate deploy` locally.

# Development notes

[How to load GraphQL data in Next.js pages](/docs/relay-pages.md)
