import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.resolve(root, "../../packages/assets");
const dest = path.join(root, "public/assets");

if (!existsSync(path.join(src, "photos", "welcome-waterfront.jpg"))) {
  throw new Error(`Missing seed photos at ${src}/photos`);
}

mkdirSync(path.dirname(dest), { recursive: true });
cpSync(src, dest, { recursive: true });
const photos = readdirSync(path.join(dest, "photos")).filter((name) => name.endsWith(".jpg"));
console.log(`Copied ${photos.length} public photos to ${path.relative(root, dest)}`);
