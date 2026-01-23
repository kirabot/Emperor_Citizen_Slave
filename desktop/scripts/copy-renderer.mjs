import { cp, rm } from "node:fs/promises";
import path from "node:path";

const sourceDir = path.resolve("../frontend/dist");
const targetDir = path.resolve("renderer-dist");

await rm(targetDir, { recursive: true, force: true });
await cp(sourceDir, targetDir, { recursive: true });

console.log(`Copied renderer from ${sourceDir} to ${targetDir}`);
