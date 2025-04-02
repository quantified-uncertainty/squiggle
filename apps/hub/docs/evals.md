# Evals

Evals are AI-based evaluations on lists of questions.

Terminology:

- **Spec**: a question that can be responded to with a value.
- **Spec List**: A collection of questions.
- **Eval** or **Evaluation**: an evaluation of a spec list, consisting of models on each spec from a given spec list.
- **Eval Runner**: a runner that produces an eval.

For a more formal definition, see the [Prisma schema](../../../internal-packages/hub-db/prisma/schema/spec.prisma).

## Eval Runners

Eval runners are responsible for producing evals. They can be of different types.

Eval runner types:

- **SquiggleAI**: an eval runner that uses Squiggle AI to produce an eval.
- (TODO: add more types)

## Spec Lists

Spec lists are collections of specs.

Spec lists can be populated manually, or generated from an external data source or an AI-powered process.

### TODO: spec list generators.

Right now the "New Spec List" button in the UI (/evals/speclists page) only allows for manually populating a spec list.

We want to convert the button to be a dropdown with the following options:

- "Manually"
- "From Metaforecast"
- "From GitHub Issues"

#### Manually

This should be the same as the current behavior: send the user to `/evals/speclists/create` page.

#### From Metaforecast

This should be a page that shows a list of available Metaforecast questions, and allows the user to select one or more of them.

To obtain the questions, we can access Metaforecast database directly, via the `@quri/metaforecast-db` package.

#### From GitHub Issues

This should be a page that prompts the user to enter a GitHub repository URL, and then prompts the user to select one or more issues from the repository.

This page should also contain a textarea that would convert the issues into questions, e.g. "Estimate the expected value for this issue".
