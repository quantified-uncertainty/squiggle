# Squiggle Codebase Guide

## Tech Stack

Here are the tools that we like and use:

- TypeScript
- Next.js with App Router and server actions
- Tailwind CSS
- Prisma
- Zod
- React Hook Form
- next-safe-action

## Build Commands

- Build all: `turbo run build`
- Build specific package: `cd packages/<package> && turbo run build`
- Run tests: `cd packages/<package> && pnpm test`
- Run single test: `cd packages/<package> && pnpm jest <path-to-test-file>`
- Lint: `cd packages/<package> && pnpm lint`
- Format: `cd packages/<package> && pnpm format`

## Code Style

- Use TypeScript with strict typing; never use `any`, try your best guess at the type if necessary, even if you're not sure it's correct
- Use `const` over `let` over `var`, default to `const`.
- React: Use functional components with `FC<Props>` typing. Inline props if the component is simple.
- Component files should match component names with named exports.
- Use Tailwind for styling; avoid direct positioning in components.
- Don't worry about the import order. `import-sorter` will take care of it.
- Format using Prettier (configured in `prettier.config.js`).
- Use workspace references with `workspace:*` for internal dependencies.
- Don't use JSDoc parameter and return type annotations. If you want to document parameters, use inline comments.
- Fail early. Prefer `throw` to try/catch.
- Reuse types and components.
- Use `useToast` from `@quri/ui` for displaying notifications and errors.
- If you have to use `JSON` fields in the database, validate them with Zod.

## Monorepo Structure

- `packages/`: NPM-published packages (squiggle-lang, components, etc.)
- `apps/`: Applications like website and hub
- `internal-packages/`: Internal not-for-npm packages

## Next.js Apps Best Practices

Described in `apps/hub/docs/nextjs.md`.
