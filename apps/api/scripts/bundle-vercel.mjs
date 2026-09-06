import { createRequire } from "node:module";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const outfile = path.join(dist, "vercel.cjs");
const bundledNodeModules = path.join(dist, "node_modules");
const requireFromDb = createRequire(
  path.join(root, "../../packages/database/package.json"),
);

function copyDir(from, to) {
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
}

const entry = path.join(dist, "main.js");
if (!existsSync(entry)) {
  throw new Error("dist/main.js is missing. Run nest build before bundle:vercel.");
}

await esbuild.build({
  absWorkingDir: root,
  entryPoints: [entry],
  outfile,
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  sourcemap: false,
  legalComments: "none",
  logLevel: "info",
  define: {
    "process.env.VERCEL": '"1"',
  },
  banner: {
    js: 'const __vercelPrisma = require("node:path").join(__dirname,"node_modules"); module.paths.unshift(__vercelPrisma); process.env.NODE_PATH=[__vercelPrisma,process.env.NODE_PATH].filter(Boolean).join(":"); require("module").Module._initPaths();',
  },
  external: [
    "@prisma/client",
    "@nestjs/microservices",
    "@nestjs/microservices/microservices-module",
    "@nestjs/websockets",
    "@nestjs/websockets/socket-module",
    "class-transformer",
    "class-transformer/storage",
    "class-validator",
  ],
});

rmSync(bundledNodeModules, { recursive: true, force: true });

function findPrismaGenerated(clientDir) {
  const candidates = [
    path.join(path.dirname(path.dirname(clientDir)), ".prisma/client"),
    path.join(root, "../../packages/database/node_modules/.prisma/client"),
  ];
  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, "index.js"))) return candidate;
  }
  throw new Error(
    `Could not find generated Prisma client. Looked in:\n${candidates.join("\n")}`,
  );
}

const prismaClientDir = path.dirname(requireFromDb.resolve("@prisma/client/package.json"));
const prismaGeneratedDir = findPrismaGenerated(prismaClientDir);
copyDir(prismaClientDir, path.join(bundledNodeModules, "@prisma/client"));
copyDir(prismaGeneratedDir, path.join(bundledNodeModules, ".prisma/client"));
rmSync(path.join(bundledNodeModules, ".prisma/client/libquery_engine-darwin.dylib.node"), {
  force: true,
});

const assetsSrc = path.join(root, "../../packages/assets");
if (existsSync(assetsSrc)) {
  copyDir(assetsSrc, path.join(dist, "assets"));
}

console.log(
  `Vercel bundle written to ${path.relative(root, outfile)} with prisma engines:`,
  readdirSync(path.join(bundledNodeModules, ".prisma/client")).filter((name) =>
    name.includes("engine") || name.endsWith(".node"),
  ),
);
