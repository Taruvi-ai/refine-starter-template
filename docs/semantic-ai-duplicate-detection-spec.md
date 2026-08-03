# Semantic/AI Duplicate Detection

## Objective

Detect differently worded Kaizens that describe the same underlying improvement by comparing Title, Problem Statement, Proposed Solution, and business context.

## Scoring

- Title semantic similarity: 20%
- Problem Statement semantic similarity: 40%
- Proposed Solution semantic similarity: 30%
- Client, Process, and Department context: 10%

## Classification

- 90–100%: Likely Duplicate — submission requires reviewer resolution.
- 70–89%: Strong Match — employee justification is mandatory.
- 40–69%: Related Idea — informational; submission remains allowed.
- Below 40%: No match displayed.

The existing exact rule remains authoritative: the same normalized Title plus the same Client or Process blocks submission.

## Result Display

Each result shows:

- Kaizen ID and Title
- Current status
- Similarity percentage and classification
- A plain-language explanation of the matched meaning
- Matched fields
- View Details action

## Runtime

The server uses `text-embedding-3-small` when `OPENAI_API_KEY` is available through Taruvi Secrets. Embeddings are cached per Kaizen and source-text hash. Without the secret, the function uses a deterministic meaning-aware fallback so duplicate checks remain available.

## Audit and Review

Persisted checks store the classification, matched-meaning explanation, scoring method, component score breakdown, employee justification, and reviewer decision.

