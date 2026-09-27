import { spawn } from "node:child_process";
import { resolve } from "node:path";

const services = [
  {
    name: "frontend",
    entry: "frontend/node_modules/vite/bin/vite.js",
    args: ["--config", "vite.config.ts"],
    cwd: "frontend",
  },
  {
    name: "api",
    entry: "node_modules/tsx/dist/cli.mjs",
    args: ["watch", "src/index.ts"],
    cwd: "backend",
  },
];

const projectRoot = process.cwd();
const children = services.map(({ name, entry, args, cwd }) => {
  const child = spawn(
    process.execPath,
    [resolve(projectRoot, entry), ...args],
    {
      cwd: resolve(projectRoot, cwd),
      stdio: "inherit",
    },
  );
  child.on("error", (error) => {
    console.error(`${name} failed to start: ${error.message}`);
    stopServices("SIGTERM");
  });
  child.on("exit", (code) => {
    if (!stopping) {
      stopServices("SIGTERM");
      process.exitCode = code ?? 1;
    }
  });
  return child;
});

let stopping = false;

function stopServices(signal) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    child.kill(signal);
  }
}

process.on("SIGINT", () => stopServices("SIGINT"));
process.on("SIGTERM", () => stopServices("SIGTERM"));
