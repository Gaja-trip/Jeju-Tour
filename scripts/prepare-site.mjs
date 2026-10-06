import { copyFile, mkdir, mkdtemp, readdir, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const work = join(root, ".test-output");
await mkdir(work, { recursive: true });
const release = await mkdtemp(join(work, "site-release-"));
const output = join(release, ".vercel", "output");
const site = join(output, "static");
await mkdir(site, { recursive: true });
const files = ["index.html", "course.html", "meeting.html", "event.html", "restaurants.html",
  "schedule.html", "live.html", "transport.html", "styles.css", "app.js", "gpx-route.js",
  "event.js", "event-config.js", "logo.svg", "live-location-config.js", "live-location-core.js", "live-location.js", "my-location.js"];
const types = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".pdf", ".gpx", ".woff2"]);
async function assets(directory) {
  for (const entry of await readdir(join(root, directory), { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await assets(path);
    else if (entry.isFile() && types.has(extname(path).toLowerCase())) files.push(path);
  }
}
await assets("assets");
for (const file of files) {
  const target = join(site, file);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(join(root, file), target);
}
await writeFile(join(output, "config.json"), JSON.stringify({ version: 3, routes: [
  { src: "/(.*)", headers: { "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "Permissions-Policy": "geolocation=(self)" }, continue: true },
  { src: "/(?:index|course)\\.html|/(?:live-location(?:-config|-core)?|my-location)\\.js", headers: { "Cache-Control": "no-cache" }, continue: true },
  { handle: "filesystem" }
] }, null, 2) + "\n");
console.log(JSON.stringify({ release, staticDirectory: site, fileCount: files.length }));
