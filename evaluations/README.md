# Evaluations

Simple evaluation tool for benchmarking Squiggle AI workflows across different LLMs and prompts.

## What it does

Runs multiple Squiggle AI code generation workflows with:
- Different LLM models (Claude, Gemini, etc.)
- Various prompts (Fermi estimates, financial projections, etc.)
- Configurable number of runs per combination

Outputs results as JSON and CSV files with metrics like success rate, cost, execution time, and code quality.

## Setup

1. Copy `.env.example` to `.env` (if available) or create a `.env` file with:
   ```
   ANTHROPIC_API_KEY=your_key
   OPENAI_API_KEY=your_key
   OPENROUTER_API_KEY=your_key
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

## Usage

```bash
pnpm simpleEvals
```

Follow the interactive prompts to:
1. Select which models to test
2. Choose prompts to run
3. Optionally add a custom prompt
4. Set number of runs per combination

Results are saved as `eval-results-[timestamp].json` and `eval-results-[timestamp].csv`.
