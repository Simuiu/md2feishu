#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync, watch as fsWatch } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import process from "node:process";

const toolRoot = resolve(fileURLToPath(import.meta.url), "..", "..");
const stateDir = process.env.MD2FEISHU_STATE_DIR || resolve(homedir(), ".md2feishu");
const mapPath = process.env.MD2FEISHU_STATE_FILE || resolve(stateDir, "state.json");

const usage = `md2feishu

Global Markdown to Feishu sync for Codex/Claude workflows.

Usage:
  md2feishu setup [--profile <name>]
  md2feishu init [--folder-token <token>] [--root-folder-name <name>] [--profile <name>]
  md2feishu sync <file.md> [--title <title>] [--folder-token <token>] [--profile <name>] [--dry-run]
  md2feishu watch <file.md> [--title <title>] [--folder-token <token>] [--profile <name>]
  md2feishu bind <file.md> <doc-url-or-token> [--title <title>]
  md2feishu links [--cwd-only]
  md2feishu workspace status [--cwd-only]
  md2feishu workspace bind <workspace-path> <folder-token> [--name <name>]
  md2feishu workspace refresh
  md2feishu status [--cwd-only]
  md2feishu doctor [--profile <name>]

Examples:
  md2feishu setup
  md2feishu sync ./docs/spec.md
  md2feishu status --cwd-only
`;

main();

function main() {
  const { command, args, flags } = parseArgs(process.argv.slice(2));

  try {
    switch (command) {
      case "setup":
        setup(flags);
        break;
      case "init":
        init(flags);
        break;
      case "sync":
        sync(args[0], flags);
        break;
      case "watch":
        watchFile(args[0], flags);
        break;
      case "bind":
        bind(args[0], args[1], flags);
        break;
      case "links":
        links(flags);
        break;
      case "workspace":
        workspace(args, flags);
        break;
      case "status":
        status(flags);
        break;
      case "doctor":
        doctor(flags);
        break;
      case "help":
      case undefined:
      case "":
        console.log(usage);
        break;
      default:
        fail(`Unknown command: ${command}\n\n${usage}`);
    }
  } catch (error) {
    fail(error.message);
  }
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const args = [];
  const flags = {};

  for (let i = 0; i < rest.length; i += 1) {
    const item = rest[i];
    if (!item.startsWith("--")) {
      args.push(item);
      continue;
    }

    const key = item.slice(2);
    if (["dry-run", "cwd-only"].includes(key)) {
      flags[key] = true;
      continue;
    }

    const value = rest[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    flags[key] = value;
    i += 1;
  }

  return { command, args, flags };
}

function setup(flags) {
  ensureState();
  console.log("Step 1/2: initialize lark-cli configuration.");
  console.log("Follow the URL/instructions printed by lark-cli, then return here.");
  runLarkInteractive(["config", "init", "--new", "--brand", "feishu", ...(flags.profile ? ["--name", flags.profile] : [])]);

  console.log("\nStep 2/2: authorize Docs/Drive access.");
  runLarkInteractive([
    "auth",
    "login",
    "--domain",
    "docs,drive,markdown",
    "--recommend",
    "--scope",
    "space:document:retrieve search:docs:read",
    ...profileArgs(flags.profile)
  ]);

  console.log("\nSetup finished. Run `md2feishu doctor` to verify.");
}

function init(flags) {
  ensureState();
  const map = readMap();
  map.config = {
    ...map.config,
    ...(flags["folder-token"] ? { rootFolderToken: flags["folder-token"] } : {}),
    ...(flags["root-folder-name"] ? { rootFolderName: flags["root-folder-name"] } : {}),
    ...(flags.profile ? { profile: flags.profile } : {})
  };
  writeMap(map);
  console.log(`Initialized global state: ${mapPath}`);
}

function sync(file, flags = {}) {
  if (!file) {
    throw new Error("Missing Markdown file path.");
  }

  ensureState();
  const absFile = resolve(process.cwd(), file);
  validateMarkdownFile(absFile);

  const map = readMap();
  const key = toMapKey(absFile);
  const existing = map.docs[key];
  const config = map.config || {};
  const title = flags.title || extractTitle(absFile);
  const profile = flags.profile || config.profile;
  const markdownCwd = dirname(absFile);
  const markdownRef = `@${basename(absFile)}`;

  if (existing?.doc) {
    const result = runLark([
      "docs",
      "+update",
      "--doc",
      existing.doc,
      "--mode",
      "overwrite",
      "--markdown",
      markdownRef,
      "--new-title",
      title,
      ...(flags["dry-run"] ? ["--dry-run"] : []),
      ...profileArgs(profile)
    ], { cwd: markdownCwd });

    if (!flags["dry-run"]) {
      map.docs[key] = {
        ...existing,
        title,
        updatedAt: new Date().toISOString()
      };
      writeMap(map);
    }

    printResult("Updated existing Feishu document", key, map.docs[key] || existing, result);
    return;
  }

  const workspaceFolder = resolveWorkspaceFolder(map, absFile, flags, profile);
  if (!flags["dry-run"]) {
    writeMap(map);
  }

  const result = runLark([
    "docs",
    "+create",
    "--title",
    title,
    "--markdown",
    markdownRef,
    ...(workspaceFolder.folderToken ? ["--folder-token", workspaceFolder.folderToken] : []),
    ...(flags["dry-run"] ? ["--dry-run"] : []),
    ...profileArgs(profile)
  ], { cwd: markdownCwd });

  if (flags["dry-run"]) {
    printResult("Dry-run create command", key, { title, doc: "(not created)" }, result);
    return;
  }

  const parsed = parseJsonMaybe(result.stdout);
  const doc = pickDocReference(parsed);

  if (!doc) {
    throw new Error(
      "Created the document, but could not find a document URL/token in lark-cli output. Use `md2feishu bind <file.md> <doc-url-or-token>` to bind it manually."
    );
  }

  map.docs[key] = {
    title,
    doc,
    workspaceRoot: workspaceFolder.workspaceRoot,
    folderToken: workspaceFolder.folderToken,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  writeMap(map);

  printResult("Created Feishu document", key, map.docs[key], result);
}

function watchFile(file, flags) {
  if (!file) {
    throw new Error("Missing Markdown file path.");
  }

  const absFile = resolve(process.cwd(), file);
  validateMarkdownFile(absFile);
  sync(file, flags);

  let timer = undefined;
  console.log(`Watching ${toMapKey(absFile)}. Press Ctrl+C to stop.`);

  fsWatch(absFile, { persistent: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        sync(file, flags);
      } catch (error) {
        console.error(error.message);
      }
    }, 600);
  });
}

function bind(file, doc, flags) {
  if (!file) {
    throw new Error("Missing Markdown file path.");
  }
  if (!doc) {
    throw new Error("Missing Feishu document URL or token.");
  }

  ensureState();
  const absFile = resolve(process.cwd(), file);
  validateMarkdownFile(absFile);

  const map = readMap();
  const key = toMapKey(absFile);
  const workspaceRoot = resolveWorkspaceRoot(absFile);
  const workspaceInfo = map.workspaces[workspaceRoot];
  map.docs[key] = {
    ...(map.docs[key] || {}),
    title: flags.title || extractTitle(absFile),
    doc,
    workspaceRoot,
    ...(workspaceInfo?.folderToken ? { folderToken: workspaceInfo.folderToken } : {}),
    boundAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  writeMap(map);

  console.log(`Bound ${key}`);
  console.log(`  doc: ${doc}`);
}

function workspace(args, flags = {}) {
  const [subcommand, first, second] = args;

  switch (subcommand) {
    case "status":
    case undefined:
      workspaceStatus(flags);
      break;
    case "bind":
      workspaceBind(first, second, flags);
      break;
    case "refresh":
      workspaceRefresh(flags);
      break;
    default:
      throw new Error(`Unknown workspace command: ${subcommand}`);
  }
}

function workspaceStatus(flags = {}) {
  ensureState();
  const map = readMap();
  const entries = Object.entries(map.workspaces || {});
  const cwd = `${resolve(process.cwd())}/`;
  const filtered = flags["cwd-only"] ? entries.filter(([workspaceRoot]) => `${workspaceRoot}/`.startsWith(cwd) || cwd.startsWith(`${workspaceRoot}/`)) : entries;

  console.log(`Root folder name: ${rootFolderName(map)}`);
  console.log(`Root folder token: ${map.config.rootFolderToken || ""}`);

  if (filtered.length === 0) {
    console.log(flags["cwd-only"] ? "No Feishu folder is bound for this workspace yet." : "No workspace folders are bound yet.");
    return;
  }

  for (const [workspaceRoot, info] of filtered) {
    console.log(workspaceRoot);
    console.log(`  name: ${info.name || ""}`);
    console.log(`  folderToken: ${info.folderToken || ""}`);
    console.log(`  updatedAt: ${info.updatedAt || ""}`);
  }
}

function workspaceBind(workspacePath, folderToken, flags = {}) {
  if (!workspacePath) {
    throw new Error("Missing workspace path.");
  }
  if (!folderToken) {
    throw new Error("Missing Feishu folder token.");
  }

  ensureState();
  const map = readMap();
  const workspaceRoot = resolve(process.cwd(), workspacePath);
  const name = flags.name || basename(workspaceRoot);
  map.workspaces[workspaceRoot] = {
    ...(map.workspaces[workspaceRoot] || {}),
    name,
    folderToken,
    boundAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  writeMap(map);

  console.log(`Bound workspace ${workspaceRoot}`);
  console.log(`  name: ${name}`);
  console.log(`  folderToken: ${folderToken}`);
}

function workspaceRefresh(flags = {}) {
  ensureState();
  const map = readMap();
  const profile = flags.profile || map.config.profile;
  const rootToken = ensureRootFolder(map, profile);
  let changed = false;

  for (const [workspaceRoot, info] of Object.entries(map.workspaces || {})) {
    const name = info.name || basename(workspaceRoot);
    const folderToken = findChildFolder(rootToken, name, profile);
    if (folderToken && folderToken !== info.folderToken) {
      map.workspaces[workspaceRoot] = {
        ...info,
        name,
        folderToken,
        rootFolderToken: rootToken,
        updatedAt: new Date().toISOString()
      };
      for (const doc of Object.values(map.docs || {})) {
        if (doc.workspaceRoot === workspaceRoot) {
          doc.folderToken = folderToken;
        }
      }
      changed = true;
      console.log(`Refreshed ${workspaceRoot} -> ${folderToken}`);
    }
  }

  if (changed) {
    writeMap(map);
  } else {
    console.log("Workspace folder mappings are already current.");
  }
}

function status(flags = {}) {
  ensureState();
  const map = readMap();
  const entries = Object.entries(map.docs || {});
  const cwd = `${process.cwd()}/`;
  const filtered = flags["cwd-only"] ? entries.filter(([file]) => file.startsWith(cwd)) : entries;

  if (filtered.length === 0) {
    console.log(flags["cwd-only"] ? "No Markdown files under this workspace are bound yet." : "No Markdown files are bound yet.");
    return;
  }

  for (const [file, info] of filtered) {
    console.log(file);
    console.log(`  title: ${info.title || ""}`);
    console.log(`  doc:   ${info.doc || ""}`);
    console.log(`  url:   ${docUrl(info.doc) || ""}`);
    console.log(`  workspaceRoot: ${info.workspaceRoot || ""}`);
    console.log(`  folderToken: ${info.folderToken || ""}`);
    console.log(`  updatedAt: ${info.updatedAt || ""}`);
  }
}

function links(flags = {}) {
  ensureState();
  const map = readMap();
  const entries = Object.entries(map.docs || {});
  const cwd = `${process.cwd()}/`;
  const filtered = flags["cwd-only"] ? entries.filter(([file]) => file.startsWith(cwd)) : entries;

  if (filtered.length === 0) {
    console.log(flags["cwd-only"] ? "No Markdown files under this workspace are bound yet." : "No Markdown files are bound yet.");
    return;
  }

  for (const [file, info] of filtered) {
    console.log(`${info.title || file}`);
    console.log(`  local: ${file}`);
    console.log(`  feishu: ${docUrl(info.doc) || info.doc || ""}`);
  }
}

function doctor(flags) {
  ensureState();
  const lark = findLarkCli();
  console.log(`Node: ${process.version}`);
  console.log(`md2feishu state: ${mapPath}`);
  console.log(`lark-cli: ${lark}`);

  const version = spawnSync(lark, ["--version"], { encoding: "utf8" });
  if (version.status === 0) {
    console.log((version.stdout || version.stderr).trim());
  }

  const result = runLark(["doctor", ...profileArgs(flags.profile)], { allowFailure: true });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (result.status !== 0) {
    console.log("If this reports missing auth, run `md2feishu setup`.");
  }
}

function ensureState() {
  if (!existsSync(stateDir)) {
    mkdirSync(stateDir, { recursive: true });
  }
  if (!existsSync(mapPath)) {
    writeMap({ version: 1, config: {}, workspaces: {}, docs: {} });
  }
}

function readMap() {
  const raw = readFileSync(mapPath, "utf8");
  const parsed = JSON.parse(raw);
  return {
    version: parsed.version || 1,
    config: parsed.config || {},
    workspaces: parsed.workspaces || {},
    docs: parsed.docs || {}
  };
}

function writeMap(map) {
  writeFileSync(mapPath, `${JSON.stringify(map, null, 2)}\n`);
}

function validateMarkdownFile(absFile) {
  if (!existsSync(absFile)) {
    throw new Error(`File does not exist: ${absFile}`);
  }
  if (extname(absFile).toLowerCase() !== ".md") {
    throw new Error(`Expected a .md file: ${absFile}`);
  }
}

function extractTitle(absFile) {
  const content = readFileSync(absFile, "utf8");
  const heading = content.match(/^#\s+(.+?)\s*$/m);
  if (heading?.[1]) {
    return heading[1].trim();
  }
  return basename(absFile, ".md");
}

function toMapKey(absFile) {
  return resolve(absFile);
}

function resolveWorkspaceFolder(map, absFile, flags, profile) {
  const workspaceRoot = resolveWorkspaceRoot(absFile);
  const workspaceName = basename(workspaceRoot);

  if (flags["folder-token"]) {
    return {
      workspaceRoot,
      workspaceName,
      folderToken: flags["folder-token"],
      source: "flag"
    };
  }

  const existing = map.workspaces[workspaceRoot];
  if (existing?.folderToken) {
    return {
      workspaceRoot,
      workspaceName: existing.name || workspaceName,
      folderToken: existing.folderToken,
      source: "workspace"
    };
  }

  if (flags["dry-run"]) {
    console.log(`Dry-run: would ensure root folder "${rootFolderName(map)}" and workspace folder "${workspaceName}".`);
    return {
      workspaceRoot,
      workspaceName,
      folderToken: undefined,
      source: "dry-run"
    };
  }

  const rootToken = ensureRootFolder(map, profile);
  const folderToken = findChildFolder(rootToken, workspaceName, profile) || createFeishuFolder(workspaceName, rootToken, profile);
  map.workspaces[workspaceRoot] = {
    name: workspaceName,
    folderToken,
    rootFolderToken: rootToken,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return {
    workspaceRoot,
    workspaceName,
    folderToken,
    source: "created"
  };
}

function ensureRootFolder(map, profile) {
  const config = map.config || {};
  const existing = config.rootFolderToken || config.folderToken;
  if (existing) {
    map.config.rootFolderToken = existing;
    delete map.config.folderToken;
    return existing;
  }

  const name = rootFolderName(map);
  const folderToken = findRootFolder(name, profile) || createFeishuFolder(name, undefined, profile);
  map.config.rootFolderToken = folderToken;
  map.config.rootFolderName = name;
  map.config.rootFolderCreatedAt = new Date().toISOString();
  return folderToken;
}

function rootFolderName(map) {
  return map.config?.rootFolderName || "codex";
}

function createFeishuFolder(name, parentFolderToken, profile) {
  const result = runLark([
    "drive",
    "+create-folder",
    "--name",
    name,
    ...(parentFolderToken ? ["--folder-token", parentFolderToken] : []),
    ...profileArgs(profile)
  ]);

  const parsed = parseJsonMaybe(result.stdout);
  const folderToken = pickFolderToken(parsed);
  if (!folderToken) {
    throw new Error(`Created folder "${name}", but could not find its folder token in lark-cli output.`);
  }
  return folderToken;
}

function findRootFolder(name, profile) {
  return findChildFolder("", name, profile);
}

function findChildFolder(parentFolderToken, name, profile) {
  const result = runLark([
    "drive",
    "files",
    "list",
    "--params",
    JSON.stringify({
      folder_token: parentFolderToken || "",
      page_size: 200
    }),
    ...profileArgs(profile)
  ], { allowFailure: true });

  if (result.status !== 0) {
    return undefined;
  }

  const parsed = parseJsonMaybe(result.stdout);
  const files = parsed?.data?.files || parsed?.files || [];
  const folder = files.find((file) => file?.type === "folder" && file?.name === name && file?.token);
  return folder?.token;
}

function resolveWorkspaceRoot(absFile) {
  const result = spawnSync("git", ["-C", dirname(absFile), "rev-parse", "--show-toplevel"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"]
  });

  if (result.status === 0 && result.stdout.trim()) {
    return resolve(result.stdout.trim());
  }

  return resolve(process.cwd());
}

function profileArgs(profile) {
  return profile ? ["--profile", profile] : [];
}

function docUrl(doc) {
  if (!doc) {
    return "";
  }
  if (/^https?:\/\//.test(doc)) {
    return doc;
  }
  return `https://www.feishu.cn/docx/${doc}`;
}

function runLark(args, options = {}) {
  const lark = findLarkCli();
  const result = spawnSync(lark, args, {
    cwd: options.cwd || process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(`lark-cli failed:\n${result.stderr || result.stdout}\nRun \`md2feishu setup\` if lark-cli is not configured yet.`);
  }

  return {
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || ""
  };
}

function runLarkInteractive(args) {
  const lark = findLarkCli();
  const result = spawnSync(lark, args, {
    cwd: process.cwd(),
    stdio: "inherit"
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`lark-cli failed with exit code ${result.status}.`);
  }
}

function findLarkCli() {
  const local = resolve(toolRoot, "node_modules", ".bin", process.platform === "win32" ? "lark-cli.cmd" : "lark-cli");
  if (existsSync(local)) {
    return local;
  }
  return "lark-cli";
}

function parseJsonMaybe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function pickDocReference(value) {
  const found = [];
  walk(value, found);

  const url = found.find((item) => /^https?:\/\/.+/.test(item.value));
  if (url?.value) {
    return url.value;
  }

  const tokenKeys = ["document_id", "documentId", "doc_token", "docToken", "token", "file_token", "fileToken"];
  for (const item of found) {
    if (tokenKeys.includes(item.key) && item.value.length > 4) {
      return item.value;
    }
  }

  return undefined;
}

function pickFolderToken(value) {
  const found = [];
  walk(value, found);

  const tokenKeys = ["folder_token", "folderToken", "file_token", "fileToken", "token"];
  for (const item of found) {
    if (tokenKeys.includes(item.key) && item.value.length > 4) {
      return item.value;
    }
  }

  return undefined;
}

function walk(value, found, key = "") {
  if (typeof value === "string") {
    found.push({ key, value });
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      walk(item, found);
    }
    return;
  }

  if (value && typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value)) {
      walk(childValue, found, childKey);
    }
  }
}

function printResult(action, file, info, result) {
  console.log(action);
  console.log(`  file: ${file}`);
  console.log(`  title: ${info.title || ""}`);
  console.log(`  doc: ${info.doc || ""}`);

  if (result.stdout.trim()) {
    console.log("\nlark-cli output:");
    console.log(result.stdout.trim());
  }
  if (result.stderr.trim()) {
    console.error(result.stderr.trim());
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
