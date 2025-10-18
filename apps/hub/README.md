This is a source code for https://squigglehub.org/.

# Development

## Configuring the environment

Squiggle Hub needs a `.env` config file to run. (`.env` is git-ignored by default, but you can also use `.env.local`; refer to [Next.js](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables) documentation for details.)

The typical config looks like this:

```bash
DATABASE_URL=postgres://postgres@localhost:5432/[your-db-name] # You need a Postgres database; on macOS the easiest option is https://postgresapp.com/
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=OwXOS457opeQzuhsKLItdhFDMrta2dcRlehqoQBGyKg= # Any random string works for local dev
DEV_AUTH_ENABLED=true # Enables simple email auth - login links print to console (no email service needed)
ROOT_EMAILS=[your-email] # Email of the root user on Squiggle Hub, to get extra permissions
```

## Managing the database

Database layer is in the `internal-packages/hub-db` package. See [hub-db/README.md](./internal-packages/hub-db/README.md) for details.

# Deployment

Squiggle Hub is deployed on [Vercel](https://vercel.com/) automatically when the new code gets merged to the `main` branch.

## Database migrations

The production database is migrated by [this GitHub Action](https://github.com/quantified-uncertainty/squiggle/blob/main/.github/workflows/prisma-migrate-prod.yml).

**Important: it should be invoked _before_ merging any PR that changes the schema.**
