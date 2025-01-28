# TypeScript

- avoid `any`; get rid of any existing `any` whenever you can so that we can enable `"strict": true` later on in `tsconfig.json`
- define custom types for common data structures
  - don't worry about `interface` vs `type`, [both are fine](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)

## Typescript and React/Next

- use `React.FC<Props>` type for React components, e.g. `const MyComponent: React.FC<Props> = ({ ... }) => { ... };`
- use `NextPage<Props>` for typing stuff in `src/pages/`
- use generic versions of `GetServerSideProps<Props>` and `GetStaticProps<Props>`

# React

- create one file per one component (tiny helper components in the same file are fine)
- name file identically to the component it describes (e.g. `const DisplayQuestions: React.FC<Props> = ...` in `DisplayQuestions.ts`)
- use named export instead of default export for all React components
  - it's better for refactoring
  - and it plays well with `React.FC` typing

# Styles

- use [Tailwind](https://tailwindcss.com/)
- avoid positioning styles in components, position elements from the outside (e.g. with [space-\*](https://tailwindcss.com/docs/space) or grid/flexbox)

# General notes

- use `const` instead of `let` whenever possible
- set up [prettier](https://prettier.io/) to format code on save
