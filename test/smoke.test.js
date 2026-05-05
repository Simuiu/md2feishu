import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const stateDir = mkdtempSync(join(tmpdir(), "md2feishu-test-"));

try {
  const help = spawnSync("node", ["./bin/md2feishu.js", "help"], {
    encoding: "utf8",
    env: {
      ...process.env,
      MD2FEISHU_STATE_DIR: stateDir
    }
  });

  if (help.status !== 0) {
    console.error(help.stderr || help.stdout);
    process.exit(help.status || 1);
  }

  if (!help.stdout.includes("md2feishu sync <file.md>")) {
    console.error("help output did not include sync usage");
    process.exit(1);
  }

  const status = spawnSync("node", ["./bin/md2feishu.js", "status"], {
    encoding: "utf8",
    env: {
      ...process.env,
      MD2FEISHU_STATE_DIR: stateDir
    }
  });

  if (status.status !== 0) {
    console.error(status.stderr || status.stdout);
    process.exit(status.status || 1);
  }
} finally {
  rmSync(stateDir, { recursive: true, force: true });
}
