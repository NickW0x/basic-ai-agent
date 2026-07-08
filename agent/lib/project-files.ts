import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();

const DENIED_PATH_SEGMENTS = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
]);

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".workflow-data",
  ".eve",
  ".cursor",
  "dist",
  "build",
]);

export interface ReadProjectFileResult {
  path: string;
  content: string;
  startLine: number;
  endLine: number;
  totalLines: number;
}

export interface GrepProjectMatch {
  path: string;
  line: number;
  text: string;
}

export interface GrepProjectResult {
  pattern: string;
  matches: GrepProjectMatch[];
  truncated: boolean;
}

export interface GlobProjectResult {
  pattern: string;
  files: string[];
  truncated: boolean;
}

// Resolves a user path under the repo root and blocks traversal or secrets.
export function resolveProjectPath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const resolved = path.resolve(PROJECT_ROOT, normalized);

  if (!resolved.startsWith(PROJECT_ROOT)) {
    throw new Error("Path escapes project root");
  }

  const segments = normalized.split("/").filter(Boolean);
  for (const segment of segments) {
    if (DENIED_PATH_SEGMENTS.has(segment)) {
      throw new Error(`Access denied: ${segment}`);
    }
  }

  return resolved;
}

export function readProjectFile(
  relativePath: string,
  startLine = 1,
  endLine?: number,
): ReadProjectFileResult {
  const absolutePath = resolveProjectPath(relativePath);

  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    throw new Error(`File not found: ${relativePath}`);
  }

  const content = fs.readFileSync(absolutePath, "utf8");
  const lines = content.split(/\r?\n/u);
  const safeStart = Math.max(1, startLine);
  const safeEnd = Math.min(endLine ?? lines.length, lines.length);
  const slice = lines.slice(safeStart - 1, safeEnd);

  return {
    path: relativePath.replace(/\\/g, "/"),
    content: slice.join("\n"),
    startLine: safeStart,
    endLine: safeEnd,
    totalLines: lines.length,
  };
}

function shouldSkipDir(name: string): boolean {
  return SKIP_DIRS.has(name);
}

function walkProjectFiles(
  dir: string,
  files: string[],
  maxFiles: number,
): boolean {
  if (files.length >= maxFiles) {
    return true;
  }

  let entries: fs.Dirent[];

  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }

  for (const entry of entries) {
    if (files.length >= maxFiles) {
      return true;
    }

    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name)) {
        continue;
      }

      const truncated = walkProjectFiles(
        path.join(dir, entry.name),
        files,
        maxFiles,
      );

      if (truncated) {
        return true;
      }

      continue;
    }

    if (entry.isFile()) {
      const relative = path
        .relative(PROJECT_ROOT, path.join(dir, entry.name))
        .replace(/\\/g, "/");

      try {
        resolveProjectPath(relative);
        files.push(relative);
      } catch {
        // Skip denied paths.
      }
    }
  }

  return false;
}

function globToRegExp(pattern: string): RegExp {
  const normalized = pattern.replace(/\\/g, "/");

  // Recursive glob: prefix/**/suffix
  if (normalized.includes("**")) {
    const [prefix = "", suffix = ""] = normalized.split("**", 2);
    const escapedPrefix = prefix
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, "[^/]*");
    const escapedSuffix = suffix
      .replace(/^\//, "")
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*");

    if (!escapedSuffix) {
      return new RegExp(`^${escapedPrefix}.*$`, "u");
    }

    return new RegExp(`^${escapedPrefix}.*${escapedSuffix}$`, "u");
  }

  const escaped = normalized
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, ".");

  return new RegExp(`^${escaped}$`, "u");
}

export function globProject(pattern: string, maxFiles = 200): GlobProjectResult {
  const matcher = globToRegExp(pattern);
  const files: string[] = [];
  const truncated = walkProjectFiles(PROJECT_ROOT, files, maxFiles * 8);
  const matched = files.filter((file) => matcher.test(file)).slice(0, maxFiles);

  return {
    pattern,
    files: matched,
    truncated: truncated || matched.length >= maxFiles,
  };
}

export function grepProject(
  pattern: string,
  fileGlob = "**/*",
  maxMatches = 100,
): GrepProjectResult {
  const regex = new RegExp(pattern, "iu");
  const { files } = globProject(fileGlob, 500);
  const matches: GrepProjectMatch[] = [];

  for (const file of files) {
    if (matches.length >= maxMatches) {
      break;
    }

    let content: string;

    try {
      content = readProjectFile(file).content;
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/u);

    for (let index = 0; index < lines.length; index += 1) {
      if (matches.length >= maxMatches) {
        break;
      }

      const line = lines[index];
      if (regex.test(line)) {
        matches.push({
          path: file,
          line: index + 1,
          text: line.trim(),
        });
      }
    }
  }

  return {
    pattern,
    matches,
    truncated: matches.length >= maxMatches,
  };
}
