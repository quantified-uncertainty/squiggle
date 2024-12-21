# Squiggle AI

This is a collection of functions and scripts that allow you to write and debug Squiggle code using a variety of LLMs.

The example frontend that uses it is implemented in [Squiggle Hub](https://squigglehub.org/ai); see [app/ai files](https://github.com/quantified-uncertainty/squiggle/tree/main/apps/hub/src/app/ai) for details.

Note that it can take 20s-2min to run a workflow and get a response from the LLM.

After runs are complete, the results are saved to the 'logs' folder. These are saved as Markdown files. It's recommended to use the VSCode Markdown Preview plugin or similar to view the results. In these logs, note the "expand" arrows on the left of some items - these can be clicked to expand the item and see more details.

## Use

Right now, Squiggle AI is primarily called in Squiggle Hub. You can see the corresponding route [here](https://github.com/quantified-uncertainty/squiggle/blob/main/apps/hub/src/app/ai/api/create/route.ts).

You can also call this via the command line. Look at src/scripts/tests/create.ts for an example.

Contact us if you'd like additional guidance.

## Potential Improvements

- If a long run gets interrupted, return the last _working_ state. Right now it just returns the last state, which may be invalid.
- Testing/evals/improvements on the prompts. These were done quickly and could be improved.
- Try to use cheaper LLM models for some fixes. Many fixes seem like they should be very easy/cheap to do.
- LLM summaries of the logs. Try to list out key errors and error fixes. Ideally, these could be used to update the suggestions.
- Fine-tuning could be used to improve the LLMs for writing Squiggle Code.
- Pull documentation, sTest, and other key Squiggle libraries from other parts of the Squiggle repo and SquiggleHub. Right now, a lot of this was done manually.
- Start workflows by being ambitious, then tune down the ambition over time. If there have been a long round of errors, be conservative for future runs. Like simulated annealing.
- Improve policies for "giving up" on a code state, and reverting or restarting.
- Find ways of automating the process of adding new suggestions for fixes, based on data from the logs.
- Have policies for dealing with repeated errors. This happens frequently with cheaper LLMs.
- Have much better examples of Squiggle code, for the prompts. If there are enough examples, specific ones could be used for certain kinds of requests.
- Sometimes the LLM will return an invalid response. This sometimes gets added to the messages history, which then can contaminate future runs.
- Warnings if there are "to" statements that go at zero or below, or any triangular distributions.

## Key Limitations

- Right now, it often costs around $0.2 and 2 minutes per 80 lines of code or so, with Claude 3.5 Sonnet.
- It's very difficult to request for models with over 80 lines of code or so.
- The system is made to generate new Squiggle, not fix improve or fix existing code.
- There's no parallelization yet. That said, it's tricky to parallelize code improvements, especially without spending a lot of extra money.
- This system doesn't return anything (outside the console.log statements) until the end of a run. So the user will be left hanging for a while.

## Key Future Features

- Add web search capabilities, perhaps with Perplexity search, or similar.
- Add an "edit" workflow, where the user can edit the code, and then re-run the code.
- Integrate this deeper with the Squiggle Playground. Perhaps bugs can be automatically fixed in the background.
- API access. For running all available actions.
- Sensitivity analysis for Squiggle variables. Then, spend extra attention on the most important variables.
- Specialized examples/features for certain types of Squiggle code. For example - relative value estimates, cost-effectiveness estimates, simulations, complex functions, standard library functions, etc.
- Evals for the accuracy of Squiggle code, to the best of our ability.
- Share the Markdown logs with the user, so they can be used for other purposes. Maybe these can be stored in s3 or similar.

## Recommended Environment Variables

When using `createSquiggle` and `editSquiggle` scripts, you should define the following environment variables:

```
ANTHROPIC_API_KEY= // needed for using Claude models
OPENAI_API_KEY= // needed for using OpenAI models
```

## Internals

### Concepts

#### WorkflowTemplate

A description of a multi-step **workflow** that would transform its **inputs** into its **outputs** by going through several **steps**.

Each workflow template has a name, and all templates should be registered in `src/workflows/registry.ts`, so that we can deserialize them by name.

Workflows can have inputs, which are **artifacts**.

#### Workflow

An instance of `WorkflowTemplate` that describes a single living workflow.

Workflows incrementally run their steps and inject new steps into themselves based on the outcomes of previous steps.

#### Controller loop

Each `WorkflowTemplate` configures the workflow with a specific "controller loop": one or more event handlers that add new workflow steps based on events (usually `stepFinished` events) that have happened.

Controller loop don't exist as objects; it's just a handle for the part of the codebase that configures the loop.

The configuration happens in `configureControllerLoop` function in `WorkflowTemplate` definitions.

#### Artifacts

Artifacts are objects that are passed between steps. Both workflows and steps have artifacts as inputs or outputs.

Each artifact has a type, which determines its "shape" (prompt, code, etc).

Artifacts have unique identifiers, so that we can detect when one step is using the output of another step without explicitly connecting them.

#### LLMStepTemplate

Step templates describe a behavior of a single step in a workflow.

Similar to `WorkflowTemplate`, each step template has a name, and all step templates should be registered in `src/steps/registry.ts`.

For now, all steps are "LLM" steps. This might change in the future.

#### LLMStepInstance

An instance of a `LLMStepTemplate`. Step instances have specific inputs and outputs, a state ("PENDING", "DONE", or "FAILED"), and a conversation history.

### Serialization formats

Workflows have two different serialization formats:

#### SerializedWorkflow

`SerializedWorkflow` is used for storing workflows in the database. `SerializedWorkflow` can be fully reconstructed into a `Workflow` object.

`SerializedWorkflow` format is based on `@quri/serializer`, which normalizes the data. The format is not optimized to be human-readable: all object references are transformed into IDs.

#### ClientWorkflow

`ClientWorkflow`: used for representing workflows in the frontend.

`Workflow` objects include server-only code, so we can't have them on the frontend directly, and we send `ClientWorkflow` objects to the frontend.

The advantage of this format is that it's simpler, and it can be incrementally updated by streaming messages as the workflow runs.

### Streaming

You can convert `Workflow` to a stream of JSON-encoded messages by using `workflow.runAsStream()`.

Then you can decode the stream into a `ClientWorkflow` by using `decodeWorkflowFromReader`.

See Squiggle Hub code for details on this.
