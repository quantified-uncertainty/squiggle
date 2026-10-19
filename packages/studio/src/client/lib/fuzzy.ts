// Fuzzy matching for Quick Open, the command palette and generic pickers
// (§3.10). Pure functions, no DOM.
//
// A query matches a target when its characters (whitespace ignored) appear in
// order, case-insensitively. Among all alignments the best-scoring one is
// chosen (dynamic programming over query × target positions), so highlights
// land on word starts and consecutive runs rather than on the first
// occurrence of each letter.

export type FuzzyMatch = {
  score: number;
  positions: number[]; // indices into the target, ascending
};

const MATCH = 1;
const WORD_START = 8; // start of the string, after a separator, or camelCase
const CONSECUTIVE = 6; // the previous query character matched just before
const GAP = 1; // per skipped target character between two matches

const SEPARATORS = new Set(["/", "\\", "-", "_", ".", " ", ":", "(", ","]);

const isLower = (c: string) => c !== c.toUpperCase() && c === c.toLowerCase();
const isUpper = (c: string) => c !== c.toLowerCase() && c === c.toUpperCase();

function isWordStart(target: string, i: number): boolean {
  if (i === 0) return true;
  const prev = target[i - 1];
  if (SEPARATORS.has(prev)) return true;
  return isLower(prev) && isUpper(target[i]);
}

function normalizeQuery(query: string): string {
  return query.replace(/\s+/g, "").toLowerCase();
}

// The best match of `query` in `target`, or undefined. An empty query
// matches everything with score 0.
export function fuzzyMatch(
  query: string,
  target: string
): FuzzyMatch | undefined {
  const q = normalizeQuery(query);
  const m = q.length;
  const n = target.length;
  if (m === 0) return { score: 0, positions: [] };
  if (m > n) return undefined;
  const lower = target.toLowerCase();

  // Cheap rejection: not even a subsequence.
  for (let j = 0, k = 0; k < m; j++) {
    if (j >= n) return undefined;
    if (lower[j] === q[k]) k++;
  }

  const NEG = Number.NEGATIVE_INFINITY;
  const scores: Float64Array[] = [];
  const from: Int32Array[] = [];
  for (let i = 0; i < m; i++) {
    const row = new Float64Array(n).fill(NEG);
    const back = new Int32Array(n).fill(-1);
    const prev = i > 0 ? scores[i - 1] : undefined;
    // best = max over k <= j-2 of prev[k] - GAP * (j - 1 - k), and its k.
    let best = NEG;
    let bestK = -1;
    for (let j = 0; j < n; j++) {
      if (prev && j >= 2) {
        best -= GAP;
        const candidate = prev[j - 2] - GAP;
        if (candidate > best) {
          best = candidate;
          bestK = j - 2;
        }
      }
      if (lower[j] !== q[i]) continue;
      const charScore = MATCH + (isWordStart(target, j) ? WORD_START : 0);
      if (!prev) {
        row[j] = charScore;
        continue;
      }
      let s = NEG;
      let k = -1;
      if (j >= 1 && prev[j - 1] > NEG) {
        s = prev[j - 1] + CONSECUTIVE;
        k = j - 1;
      }
      if (best > s) {
        s = best;
        k = bestK;
      }
      if (s === NEG) continue;
      row[j] = s + charScore;
      back[j] = k;
    }
    scores.push(row);
    from.push(back);
  }

  const last = scores[m - 1];
  let end = -1;
  for (let j = 0; j < n; j++) {
    if (last[j] > NEG && (end === -1 || last[j] > last[end])) end = j;
  }
  if (end === -1) return undefined;
  const positions: number[] = new Array<number>(m);
  for (let i = m - 1, j = end; i >= 0; i--) {
    positions[i] = j;
    j = from[i][j];
  }
  return { score: last[end], positions };
}

// ── Files ──────────────────────────────────────────────────────────────────

export type FileMatch = {
  path: string;
  // 1 when the whole query matched inside the basename, 0 when it needed the
  // directory part. Basename matches always rank first.
  tier: 0 | 1;
  score: number;
  positions: number[]; // indices into `path`
};

// Matches a root-relative path. A query containing "/" is matched against the
// whole path only.
export function matchFile(query: string, path: string): FileMatch | undefined {
  const slash = path.lastIndexOf("/");
  if (!query.includes("/")) {
    const base = fuzzyMatch(query, path.slice(slash + 1));
    if (base) {
      return {
        path,
        tier: 1,
        score: base.score,
        positions: base.positions.map((p) => p + slash + 1),
      };
    }
  }
  const full = fuzzyMatch(query, path);
  return full ? { path, tier: 0, ...full } : undefined;
}

// Every path matching `query`, best first: basename matches before directory
// matches, then by score (word starts and consecutive runs), then shorter
// paths, then more recently used (`mru`, most recent first), then by path.
export function rankFiles(
  query: string,
  paths: readonly string[],
  mru: readonly string[] = []
): FileMatch[] {
  const recency = new Map(mru.map((p, i) => [p, i]));
  const matches: FileMatch[] = [];
  for (const path of paths) {
    const match = matchFile(query, path);
    if (match) matches.push(match);
  }
  return matches.sort(
    (a, b) =>
      b.tier - a.tier ||
      b.score - a.score ||
      a.path.length - b.path.length ||
      (recency.get(a.path) ?? Infinity) - (recency.get(b.path) ?? Infinity) ||
      a.path.localeCompare(b.path)
  );
}

// ── Highlights ─────────────────────────────────────────────────────────────

export type Segment = { text: string; match: boolean };

// Splits `text` into matched and unmatched runs. `positions` are indices into
// a longer string of which `text` starts at `offset` (e.g. the basename part
// of a path); positions outside `text` are ignored.
export function highlightSegments(
  text: string,
  positions: readonly number[],
  offset = 0
): Segment[] {
  const marked = new Set<number>();
  for (const p of positions) {
    const i = p - offset;
    if (i >= 0 && i < text.length) marked.add(i);
  }
  const segments: Segment[] = [];
  for (let i = 0; i < text.length; i++) {
    const match = marked.has(i);
    const last = segments[segments.length - 1];
    if (last && last.match === match) last.text += text[i];
    else segments.push({ text: text[i], match });
  }
  return segments;
}
