# Fermi Model Competition Utilities

Tools for collecting and evaluating submissions to the $300 Fermi Model Competition:
https://forum.effectivealtruism.org/posts/Zc5jki9nXihueDcKj/usd300-fermi-model-competition

`./contest-description.md` contains the full contest description for Claude Code reference.

## Usage

### Setup

```bash
# Install dependencies
pnpm install
```

### Collecting Submissions

Run the interactive submission collector:

```bash
pnpm collect
```

This tool will guide you through collecting model submissions via the terminal. Follow the prompts to enter:

- Author name
- Model content (multi-line, end with 'END')
- Summary of findings
- Technique used

Submissions are stored in `data/submissions.json`.

### Evaluating Submissions

To evaluate submissions using Claude:

1. Create a `.env` file with your Anthropic API key:

   ```
   ANTHROPIC_API_KEY=your_key_here
   LLM_MODEL=claude-3-5-sonnet-20240620
   RUNS_PER_SUBMISSION=3
   ```

2. Run the evaluation:
   ```bash
   pnpm evaluate
   ```

Evaluation results will be saved to:

- `data/evaluation-report.md` - Formatted report with rankings and explanations
- `data/evaluation-results.json` - Raw evaluation data

### Viewing Results in Web Interface

The project includes a Next.js web interface for browsing submissions and results:

```bash
# Start the web interface on http://localhost:3000
pnpm web
```

The web interface provides:
- Home page with competition information
- Submissions browser with full model details
- Results page with rankings and detailed scores

### Goodharting Penalties

To apply goodharting penalties:

1. Create or edit `data/penalties.json` with submission IDs and penalty values (0-1)
2. Rerun the evaluation

## Evaluation Process

Submissions are evaluated using Claude 3.5 Sonnet against the contest criteria:

- Surprise (40%)
- Topic Relevance (20%)
- Robustness (20%)
- Model Quality (20%)

Each submission is evaluated multiple times (default: 3) and scores are averaged.
