#!/usr/bin/env node
// Translates .claude/agents/*.md (Claude Code subagents: YAML frontmatter +
// markdown system prompt) into .codex/agents/*.toml (Codex CLI subagents:
// https://developers.openai.com/codex/subagents — name/description/
// developer_instructions, one TOML file per agent).
//
// There's no package-manager-style delivery pipeline for subagents (unlike
// skills, which install via `npx skills add`), and the two tools use
// incompatible formats. Rather than hand-maintaining two copies that drift,
// the .claude/agents/*.md files stay the single source of truth and this
// script regenerates the Codex versions on every `npm install`. Output is
// gitignored — always regenerate, never hand-edit .codex/agents/*.toml.
//
// Best-effort: never throws past its own `main()` — a translation failure
// here must not block `npm install`, same policy as the skills fetch.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const SRC_DIR = join(ROOT, ".claude", "agents");
const OUT_DIR = join(ROOT, ".codex", "agents");

// Frontmatter keys with a direct, documented Codex TOML equivalent.
// (Everything else — e.g. `tools:` — has no Codex-side counterpart and is
// left untranslated, noted in a comment so it's not silently dropped.)
const MODEL_REASONING_EFFORT_KEY = "effort";

function parseFrontmatter(source, filename) {
  const lines = source.split("\n");
  if (lines[0].trim() !== "---") {
    throw new Error(`${filename}: expected file to start with "---" frontmatter delimiter`);
  }

  const frontmatter = {};
  let i = 1;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "---") { i++; break; }

    const match = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (!match) continue; // blank/unexpected line inside frontmatter — skip
    const [, key, inlineValue] = match;

    if (inlineValue === ">" || inlineValue === "|") {
      // Block scalar: collect indented continuation lines.
      const isFolded = inlineValue === ">";
      const collected = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) {
        i++;
        collected.push(lines[i].trim());
      }
      frontmatter[key] = isFolded ? collected.join(" ") : collected.join("\n");
    } else {
      frontmatter[key] = inlineValue.trim();
    }
  }

  const body = lines.slice(i).join("\n").trim();
  return { frontmatter, body };
}

// TOML literal multi-line strings (''' ... ''') take content verbatim, no
// escaping — safest for markdown bodies full of backticks/backslashes/quotes.
// Their only constraint: content can't contain the ''' delimiter itself.
function tomlLiteralMultiline(value, context) {
  if (value.includes("'''")) {
    throw new Error(`${context}: content contains "'''", which breaks TOML literal-string encoding — needs manual handling`);
  }
  return `'''\n${value}\n'''`;
}

function tomlString(value, context) {
  if (value.includes("'''")) {
    throw new Error(`${context}: content contains "'''", which breaks TOML literal-string encoding — needs manual handling`);
  }
  return `'${value.replace(/'/g, "\\'")}'`;
}

function translateAgent(mdPath) {
  const filename = basename(mdPath);
  const source = readFileSync(mdPath, "utf-8");
  const { frontmatter, body } = parseFrontmatter(source, filename);

  if (!frontmatter.name || !frontmatter.description) {
    throw new Error(`${filename}: missing required "name" or "description" in frontmatter`);
  }
  if (!body) {
    throw new Error(`${filename}: empty body — nothing to use as developer_instructions`);
  }

  const knownKeys = new Set(["name", "description", "model", MODEL_REASONING_EFFORT_KEY]);
  const untranslated = Object.keys(frontmatter).filter((k) => !knownKeys.has(k));

  const out = [];
  out.push(`# Generated from .claude/agents/${filename} by scripts/generate-codex-agents.mjs`);
  out.push(`# Do not edit directly — edit the source .md file and run \`npm install\` (or`);
  out.push(`# \`node scripts/generate-codex-agents.mjs\`) to regenerate.`);
  if (untranslated.length > 0) {
    out.push(`# Not translated (no Codex TOML equivalent): ${untranslated.join(", ")}`);
  }
  out.push("");
  out.push(`name = ${tomlString(frontmatter.name, `${filename} name`)}`);
  out.push(`description = ${tomlLiteralMultiline(frontmatter.description, `${filename} description`)}`);

  // Claude's `model: inherit` has no Codex equivalent — omit so Codex falls
  // back to its own configured default rather than encoding a bogus model id.
  if (frontmatter.model && frontmatter.model !== "inherit") {
    out.push(`model = ${tomlString(frontmatter.model, `${filename} model`)}`);
  }
  if (frontmatter[MODEL_REASONING_EFFORT_KEY]) {
    out.push(`model_reasoning_effort = ${tomlString(frontmatter[MODEL_REASONING_EFFORT_KEY], `${filename} effort`)}`);
  }

  out.push(`developer_instructions = ${tomlLiteralMultiline(body, `${filename} body`)}`);
  out.push("");

  return { name: frontmatter.name, toml: out.join("\n") };
}

function main() {
  if (!existsSync(SRC_DIR)) {
    console.warn(`[codex-agents] ${SRC_DIR} not found — skipping (nothing to translate)`);
    return;
  }

  const mdFiles = readdirSync(SRC_DIR).filter((f) => f.endsWith(".md"));
  if (mdFiles.length === 0) {
    console.warn("[codex-agents] no .claude/agents/*.md files found — skipping");
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });

  let ok = 0;
  for (const file of mdFiles) {
    try {
      const { name, toml } = translateAgent(join(SRC_DIR, file));
      writeFileSync(join(OUT_DIR, `${name}.toml`), toml, "utf-8");
      ok++;
    } catch (err) {
      console.warn(`[codex-agents] skipped ${file}: ${err.message}`);
    }
  }
  console.log(`[codex-agents] generated ${ok}/${mdFiles.length} Codex subagent(s) in .codex/agents/`);
}

try {
  main();
} catch (err) {
  // Never let a translation failure block `npm install`.
  console.warn(`[codex-agents] generation failed, continuing: ${err.message}`);
}
