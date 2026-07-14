#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const docsDir = path.join(rootDir, "docs");
const includeReadme = process.argv.includes("--include-readme");

const ROOT_FILE_NAMES = new Set([
  "README.md",
  "package.json",
  "next.config.ts",
  "tsconfig.json",
  "eslint.config.mjs",
]);

const ROOT_PREFIXES = ["docs/", "src/", "scripts/", "data/", "public/"];

function printUsage() {
  console.log(`Usage:
  npm run check:docs
  npm run check:docs -- --include-readme

Options:
  --include-readme  Also scan README.md in addition to docs/*.md.
  --help            Show this help message.
`);
}

function walkMarkdownFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function isExternalOrRoute(target) {
  return (
    target.startsWith("#") ||
    target.startsWith("/") ||
    /^[a-z][a-z0-9+.-]*:/i.test(target)
  );
}

function stripMarkdownTarget(rawTarget) {
  let target = rawTarget.trim();

  if (target.startsWith("<") && target.endsWith(">")) {
    target = target.slice(1, -1).trim();
  }

  const whitespaceIndex = target.search(/\s/);
  if (whitespaceIndex !== -1) {
    target = target.slice(0, whitespaceIndex);
  }

  return target.split("#")[0].split("?")[0];
}

function cleanCodePath(rawValue) {
  return rawValue
    .trim()
    .replace(/^[("']+/, "")
    .replace(/[)"'.:,;]+$/, "");
}

function looksLikeLocalPath(value) {
  if (
    value.length === 0 ||
    value.includes("\n") ||
    value.includes(" ") ||
    value.includes("*") ||
    value.includes("?") ||
    value.includes("<") ||
    value.includes(">")
  ) {
    return false;
  }

  if (isExternalOrRoute(value)) {
    return false;
  }

  return (
    value.startsWith("./") ||
    value.startsWith("../") ||
    ROOT_PREFIXES.some((prefix) => value.startsWith(prefix)) ||
    ROOT_FILE_NAMES.has(value)
  );
}

function resolveReference(sourceFile, target) {
  if (
    ROOT_PREFIXES.some((prefix) => target.startsWith(prefix)) ||
    ROOT_FILE_NAMES.has(target)
  ) {
    return path.join(rootDir, target);
  }

  return path.resolve(path.dirname(sourceFile), target);
}

function collectMarkdownLinkRefs(sourceFile, text) {
  const refs = [];
  const linkRegex = /!?\[[^\]\n]*\]\(([^)\n]+)\)/g;

  for (const match of text.matchAll(linkRegex)) {
    const target = stripMarkdownTarget(match[1]);
    if (!target || isExternalOrRoute(target)) {
      continue;
    }

    refs.push({
      kind: "markdown-link",
      target,
      index: match.index,
      sourceFile,
    });
  }

  return refs;
}

function collectCodePathRefs(sourceFile, text) {
  const refs = [];
  const codeRegex = /`([^`\n]+)`/g;

  for (const match of text.matchAll(codeRegex)) {
    const target = cleanCodePath(match[1]);
    if (!looksLikeLocalPath(target)) {
      continue;
    }

    refs.push({
      kind: "code-path",
      target,
      index: match.index,
      sourceFile,
    });
  }

  return refs;
}

function lineNumberForIndex(text, index) {
  let line = 1;
  for (let offset = 0; offset < index; offset += 1) {
    if (text.charCodeAt(offset) === 10) {
      line += 1;
    }
  }
  return line;
}

function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printUsage();
    return;
  }

  const files = walkMarkdownFiles(docsDir);
  const readmePath = path.join(rootDir, "README.md");
  if (includeReadme && fs.existsSync(readmePath)) {
    files.push(readmePath);
  }

  const missing = [];
  let checkedReferences = 0;

  for (const sourceFile of files) {
    const text = fs.readFileSync(sourceFile, "utf8");
    const refs = [
      ...collectMarkdownLinkRefs(sourceFile, text),
      ...collectCodePathRefs(sourceFile, text),
    ];

    for (const ref of refs) {
      checkedReferences += 1;
      const resolvedPath = resolveReference(sourceFile, ref.target);
      if (fs.existsSync(resolvedPath)) {
        continue;
      }

      missing.push({
        ...ref,
        line: lineNumberForIndex(text, ref.index),
        resolvedPath,
      });
    }
  }

  console.log(`Scanned markdown files: ${files.length}`);
  console.log(`Checked local references: ${checkedReferences}`);

  if (missing.length > 0) {
    console.error("\nMissing local documentation references:");
    for (const item of missing) {
      console.error(
        `- ${path.relative(rootDir, item.sourceFile)}:${item.line} ` +
          `[${item.kind}] ${item.target} -> ${path.relative(
            rootDir,
            item.resolvedPath,
          )}`,
      );
    }
    process.exitCode = 1;
    return;
  }

  console.log("\nDocumentation reference check passed.");
}

main();
