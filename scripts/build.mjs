import { spawn } from "node:child_process";
for (const args of [
  ["node_modules/prisma/build/index.js", "generate"],
  ["node_modules/next/dist/bin/next", "build"],
]) {
  const code = await new Promise((resolve) =>
    spawn(process.execPath, args, { stdio: "inherit", env: process.env }).on(
      "exit",
      resolve,
    ),
  );
  if (code) process.exit(code);
}
