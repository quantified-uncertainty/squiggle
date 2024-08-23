# Squiggle LLM Runner

This is a simple TS application that allows you to write and debug Squiggle code using a variety of LLMs. There's a simple Next.js frontend app that allows you to run the code and see the results.

Note that it can take 20s-2min to get a response from the LLM.

The key file is 'src/llmRunner/main.ts'. This file contains the key default parameters for the LLMs, and the run settings. It's also the key entry point for LLM functionality.

After runs are complete, the results are saved to the 'logs' folder. These are saved as Markdown files. It's recommended to use the VSCode Markdown Preview plugin or similar to view the results. In these logs, note the "expand" arrows on the left of some items - these can be clicked to expand the item and see more details.

Right now this application is still fairly basic and experimental.

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

## Key Limitations

- We mean to eventually integrate this with the SquiggleHub.
- The "stop" button in the UI doesn't stop the run. However, it does allow the UI to start a new run.
- Right now, it often costs around $0.2 and 2 minutes per 80 lines of code or so, with Claude 3.5 Sonnet.
- It's very difficult to request for models with over 80 lines of code or so.
- The system is made to generate new Squiggle, not fix improve or fix existing code.
- There's no parallelization yet. That said, it's tricky to parallelize code improvements, especially without spending a lot of extra money.
- This system doesn't return anything (outside the console.log statements) until the end of a run. So the user will be left hanging for a while.

## Recommended Environment Variables

Make a `.env.local` file with the following environment variables:

```
ANTHROPIC_API_KEY= // needed for using Claude models
OPENROUTER_API_KEY= // needed for using OpenRouter models
```

## Running the Next.js App

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Testing the Next.js App

```bash
pnpm test
```
