Prisma doesn't support migrations in JavaScript, so we have to run custom scripts outside of the Prisma migration system, when updating the database with SQL queries gets too complicated.

# TODO

We could implement a simple custom migration system, eventually; we'll need to:

- store a flag that JS migration was applied in a custom table
- write a small wrapper that calls all JS migrations that exist and not applied yet
- integrate with Github Acitons - call a wrapper script that invokes both `prisma migrate` and a JS migration
