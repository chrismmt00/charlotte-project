import fs from "node:fs";
import { parseEnv } from "node:util";
import { spawn } from "node:child_process";

// Explicitly select one file. Next's .env.local must never silently replace a production DB.
export function loadEnv(target = "local") {
  if (!["local", "production", "test"].includes(target))
    throw new Error("Unknown environment");
  const file =
    target === "production"
      ? ".env.production"
      : target === "test"
        ? ".env.test.local"
        : ".env.local";
  if (fs.existsSync(file)) {
    for (const [key, value] of Object.entries(
      parseEnv(fs.readFileSync(file, "utf8")),
    )) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
  if (
    target === "local" &&
    process.env.DATABASE_URL &&
    !["localhost", "127.0.0.1", "[::1]"].includes(
      new URL(process.env.DATABASE_URL).hostname,
    )
  ) {
    throw new Error(
      "Local commands require a localhost database. Use --env production explicitly.",
    );
  }
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("/scripts/env.mjs")) {
  const args = process.argv.slice(2);
  let target = "local";
  const at = args.indexOf("--env");
  if (at !== -1) target = args.splice(at, 2)[1];
  loadEnv(target);
  const [command, ...rest] = args;
  const bin =
    command === "prisma"
      ? "node_modules/prisma/build/index.js"
      : command === "next"
        ? "node_modules/next/dist/bin/next"
        : command;
  const child = spawn(process.execPath, [bin, ...rest], {
    stdio: "inherit",
    env: process.env,
  });
  child.on("exit", (code) => process.exit(code ?? 1));
}
