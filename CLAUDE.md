# Squiggle Codebase Guide

## Build Commands

- Build all: `turbo run build`
- Build specific package: `cd packages/<package> && turbo run build`
- Run tests: `cd packages/<package> && pnpm test`
- Run single test: `cd packages/<package> && pnpm jest <path-to-test-file>`
- Lint: `cd packages/<package> && pnpm lint`
- Format: `cd packages/<package> && pnpm format`

## Code Style

- Use TypeScript with strict typing; avoid `any`
- Use `const` over `let` over `var`, default to `const`
- React: Use functional components with `FC<Props>` typing
- Component files should match component names with named exports
- Use Tailwind for styling; avoid direct positioning in components
- Import order: React, external libs, internal modules, types
- Format using Prettier (configured in `prettier.config.js`)
- Use workspace references with `workspace:*` for internal dependencies

## Monorepo Structure

- `packages/`: NPM-published packages (squiggle-lang, components, etc.)
- `apps/`: Applications like website and hub
- `internal-packages/`: Internal not-for-npm packages
