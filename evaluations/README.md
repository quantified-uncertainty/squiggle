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

## Quality Evaluation

After running simple evaluations, you can evaluate the quality of the generated code on multiple dimensions.

### Usage

```bash
pnpm evaluateQuality
```

Follow the interactive prompts to:
1. Select an eval results file to analyze
2. Set number of quality evaluation runs (default: 1, more runs = more reliable but slower)

### Quality Dimensions

The script evaluates each generated solution on 4 dimensions (1-10 scale):

- **Accuracy (40%)**: How correct and appropriate is the code for the given prompt?
- **Documentation (25%)**: Are variables well-named? Are there helpful comments?
- **Comprehensiveness (20%)**: Does it cover important aspects? Are edge cases considered?
- **Cleverness (15%)**: Does it use advanced features appropriately? Is it elegant?

Results include individual dimension scores and a weighted final quality score.

### Output

Results are saved as:
- `eval-results-quality-[timestamp].json` - Full results with quality scores and explanations
- `eval-results-quality-[timestamp].csv` - Tabular format for easy analysis
